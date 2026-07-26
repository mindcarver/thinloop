[CmdletBinding()]
param(
    [ValidateSet("dry", "smoke", "full")]
    [string]$Mode = "dry",

    [string]$Workspace,

    [string]$Model = "gpt-5.6-sol",

    [string]$RunId,

    [switch]$Resume
)

$runner = Join-Path $PSScriptRoot "runner\run.mjs"
$arguments = @(
    $runner,
    "--mode", $Mode,
    "--model", $Model
)

if ($Workspace) {
    $arguments += @("--workspace", $Workspace)
}

if ($RunId) {
    $arguments += @("--run-id", $RunId)
}

if ($Resume) {
    $arguments += "--resume"
}

& node @arguments
exit $LASTEXITCODE
