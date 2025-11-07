{{/*
  Shortcode: versions
  Usage:
*/}}

{{ $versions := .Page.Pages -}}

{{ range $versions -}}
  {{ if not .IsSection -}}
    {{ continue -}}
  {{ end -}}
- [{{ .Params.linkTitle }}]({{ .RelPermalink }})
{{ end -}}
