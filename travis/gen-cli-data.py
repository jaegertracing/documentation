import os
import sys
import json

if len(sys.argv) < 2:
    print("You must supply a Jaeger version as the first argument")
    exit(1)

jaeger_ver=sys.argv[1]

with open("data/cli/%s/config.json" % jaeger_ver, 'r') as f:
    cfg=json.load(f)

def generate(tool, storage=''):
    print('Generating YAML for {} and storage {}'.format(tool, storage))

    volume='%s/data/cli/%s:/data' % (os.getcwd(), jaeger_ver)
    docker_img='all-in-one' if tool == 'jaeger-all-in-one' else tool
    docker_image="jaegertracing/%s:%s" % (docker_img, jaeger_ver)

    cmd=" ".join([
        "docker run",
        "--rm",
        "--interactive",
        "--volume {}".format(volume),
        "-e SPAN_STORAGE_TYPE={}".format(storage),
        docker_image,
        "docs",
        "--format=yaml",
        "--dir=/data",
    ])
    print(cmd)
    if os.system(cmd) != 0:
        os.exit(1)
    if storage:
        os.rename(
            'data/cli/{}/{}.yaml'.format(jaeger_ver, tool),
            'data/cli/{}/{}-{}.yaml'.format(jaeger_ver, tool, storage)
        )


for tool in cfg['tools']:
    tool_cfg = cfg[tool]
    storage_types=tool_cfg['storage']
    if storage_types:
        for s in storage_types:
            generate(tool=tool, storage=s)
    generate(tool=tool)

print('Deleting _env/_docs/_version files')
os.system('bash -c "rm -rf data/cli/{}/*_*"'.format(jaeger_ver))
