# Orchestra GitHub Action

This action allows Orchestra users to run and monitor their Orchestra pipelines from GitHub Actions.

If the pipeline is backed by Orchestra, the latest published version will run. If it’s Git-backed, the pipeline YAML from the current branch and commit of the GitHub workflow will be used.

## Inputs

### `api_key`

**Required** The API key associated with your Orchestra account. Found in Settings -> API Key.

### `pipeline_id`

**Required** The ID of the pipeline you want to run.

### `poll_interval`

(Optional) The interval in seconds at which to poll the pipeline status. Default is 10 seconds.

### `environment`

(Optional) The environment name or ID to run the pipeline in. If not specified, the default environment will be used

## Outputs

### `status`

The final pipeline run status. One of SUCCEEDED, WARNING, FAILED or CANCELLED.

### `pipeline_name`

The name of the pipeline.

### `pipeline_run_id`

The ID of the pipeline run.

## Example usage

```yaml
uses: orchestra/orchestra-action
with:
  api_key: ${{ secrets.ORCHESTRA_API_KEY }}
  pipeline_id: "your-pipeline-id"
```
