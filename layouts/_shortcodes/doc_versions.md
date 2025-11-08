{{ $versions := .Page.Pages -}}

Available versions:

{{ range $versions -}}
{{ if not .IsSection }}{{ continue }}{{ end -}}
- [{{ .Params.linkTitle }}]({{ .RelPermalink }})
{{ end -}}
