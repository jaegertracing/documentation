MKDOCS_VIRTUAL_ENV=.mkdocs-virtual-env

.PHONY: clean
clean:
	rm -rf site

.PHONY: bootstrap
bootstrap: $(MKDOCS_VIRTUAL_ENV)

.PHONY: serve
serve: $(MKDOCS_VIRTUAL_ENV)
	bash -c 'source $(MKDOCS_VIRTUAL_ENV)/bin/activate; mkdocs serve'

.PHONY: build
build: $(MKDOCS_VIRTUAL_ENV)
	bash -c 'source $(MKDOCS_VIRTUAL_ENV)/bin/activate; mkdocs build'

$(MKDOCS_VIRTUAL_ENV):
	virtualenv $(MKDOCS_VIRTUAL_ENV)
	bash -c 'source $(MKDOCS_VIRTUAL_ENV)/bin/activate; pip install -r requirements.txt'
