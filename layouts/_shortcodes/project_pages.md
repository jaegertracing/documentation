{{ $pages := where site.Home.Pages "RelPermalink" "!=" .Page.RelPermalink -}}

{{ range $pages -}}
- [{{ .Params.linkTitle | default .Params.title }}]({{ .RelPermalink }})
{{ end -}}
