import os
import sys
import json

if len(sys.argv) < 3:
    print("You must supply a Jaeger version as the first argument and "
          "the output path as the second")
    sys.exit(1)

jaeger_ver = sys.argv[1]
output_path = sys.argv[2]

with open(f"{output_path}/data/cli/{jaeger_ver}/config.json", 'r') as f:
    cfg = json.load(f)


# generate generates the CLI documentation for a given "tool" (e.g.
# jaeger-collector, jaeger-query, etc.) and feature (e.g. storage=elasticsearch,
# sampling=adaptive, metrics-storage=prometheus).
def generate(tool, **kwargs):
    if len(kwargs) > 1:
        print(f"Expected at most 1 feature, got {len(kwargs)}.")
        sys.exit(1)

    feature_name = ""

    # Get the first feature value (e.g. elasticsearch, adaptive, prometheus,
    # etc.) in kwargs if it exists. The feature name (e.g. storage,
    # sampling, metrics-storage) is not used, and hence ignored.
    for _, feature_name in kwargs.items():
        break

    print(f'Generating YAML for tool: {tool}, feature: {feature_name}')

    volume = f'{output_path}/data/cli/{jaeger_ver}:/data'
    docker_img = 'all-in-one' if tool == 'jaeger-all-in-one' else tool
    docker_image = f"jaegertracing/{docker_img}:{jaeger_ver}"

    cmd = " ".join([
        "docker run",
        "--rm",
        "--interactive",
        "--privileged",
        f"--volume {volume}",
        f"-e SPAN_STORAGE_TYPE={kwargs.get('storage', '')}",
        f"-e SAMPLING_CONFIG_TYPE={kwargs.get('sampling', '')}",
        f"-e METRICS_STORAGE_TYPE={kwargs.get('metrics_storage', '')}",
        docker_image,
        "docs",
        "--format=yaml",
        "--dir=/data",
    ])
    print(cmd)
    if os.system(cmd) != 0:
        sys.exit(1)

    if feature_name:
        os.rename(
            f'{output_path}/data/cli/{jaeger_ver}/{tool}.yaml',
            f'{output_path}/data/cli/{jaeger_ver}/{tool}-{feature_name}.yaml')


for tool in cfg['tools']:
    tool_cfg = cfg[tool]
    storage_types = tool_cfg['storage']
    sampling_types = tool_cfg['sampling']
    metrics_storage_types = tool_cfg['metrics-storage']

    for s in storage_types:
        generate(tool=tool, storage=s)
    for s in sampling_types:
        generate(tool=tool, sampling=s)
    for s in metrics_storage_types:
        generate(tool=tool, metrics_storage=s)
    generate(tool=tool)

print('Deleting _env/_docs/_version files')
os.system(f'bash -c "rm -rf data/cli/{jaeger_ver}/*_*"')
