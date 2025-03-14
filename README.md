# Orchestra Run Pipeline v1

This action allows Orchestra users to run and monitor their Orchestra pipelines from GitHub Actions.

If the pipeline is backed by Orchestra, the latest published version will run. If it’s Git-backed, the pipeline YAML from the current branch and commit of the GitHub workflow will be used. When re-running a GitHub workflow, we will aim to restart the underlying Orchestra pipeline run.

## Inputs

### `api_key`

**Required** The API key associated with your Orchestra account. Found in Settings -> API Key.

### `pipeline_id`

**Required** The ID of the pipeline you want to run.

### `poll_interval`

(Optional) The interval in seconds at which to poll the pipeline status. Default is 10 seconds.

### `environment`

(Optional) The environment name or ID to run the pipeline in. If not specified, the default environment will be used

### `task_ids`

(Optional) If the user wants to run a subset of tasks in the pipeline, they can specify the IDs of the tasks to run. No task group ids are supported.

### `continue_downstream_run`

(Optional) If the user wants to continue a downstream run after running specific task IDs just set this to true.

## Outputs

### `status`

The final pipeline run status. One of SUCCEEDED, WARNING, FAILED or CANCELLED.

### `pipeline_name`

The name of the pipeline.

### `pipeline_run_id`

The ID of the pipeline run.

## Example usage

```yaml
uses: orchestra-hq/run-pipeline@v1
with:
  api_key: ${{ secrets.ORCHESTRA_API_KEY }}
  pipeline_id: "your-pipeline-id"
  task_ids: "task-id-1,task-id-2"
  continue_downstream_run: true
```
