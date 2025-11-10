{{ $pages := where site.Home.Pages "RelPermalink" "!=" .Page.RelPermalink -}}

{{ range $pages -}}
{{ if .Params.toc_hide -}}{{ continue }}{{ end -}}
- [{{ .Params.linkTitle | default .Params.title }}]({{ .RelPermalink }})
{{ end -}}
