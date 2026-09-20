# Orchestra Run Pipeline v1

This action allows Orchestra users to run and monitor their Orchestra pipelines from GitHub Actions.

If the pipeline is backed by Orchestra, the latest published version will run. If it’s Git-backed, the pipeline YAML from the current branch and commit of the GitHub workflow will be used. When re-running a GitHub workflow, we will aim to restart the underlying Orchestra pipeline run.

## Inputs

### `api_key`

**Required** The API key associated with your Orchestra account. Found in Settings -> API Key.

### `pipeline_id`

**Required** The ID of the pipeline you want to run.

### `branch`

(Optional) The branch to run the pipeline on. If not specified, the current branch will be used.

### `poll_interval`

(Optional) The interval in seconds at which to poll the pipeline status. Default is 10 seconds.

### `environment`

(Optional) The environment name or ID to run the pipeline in. If not specified, the default environment will be used

### `task_ids`

(Optional) To run a subset of tasks in the pipeline, specify the task IDs separated by a comma. No task group ids are supported.

### `continue_downstream_run`

(Optional) To continue running downstream tasks after specifying task IDs, set this to true.

### `retry_from_failed`

(Optional) Set this to true to retry the pipeline run from the failed tasks rather than re-running every task.

### `run_inputs`

(Optional) A JSON-formatted string containing key-value pairs of pipeline run inputs. These values override any default inputs defined in the pipeline and are required if the pipeline has required inputs with no defaults.

### `cancel_on_exit`

(Optional) Whether to cancel the Orchestra pipeline run if the action stops watching it before it reaches a terminal status. Default is true. See [Cancellation](#cancellation).

## Outputs

### `status`

The final pipeline run status. One of SUCCEEDED, WARNING, FAILED, CANCELLED or SKIPPED (the pipeline run was skipped, e.g. because the pipeline's concurrency limit was reached).

### `pipeline_name`

The name of the pipeline.

### `pipeline_run_id`

The ID of the pipeline run.

## Cancellation

By default, if the action stops watching a pipeline run before that run reaches a
terminal status, it asks Orchestra to cancel the run. This stops a cancelled GitHub
job from leaving an orphaned pipeline run behind, which would otherwise keep
consuming a pipeline concurrency slot and cause later runs to be `SKIPPED`.

This happens when:

- the GitHub workflow or job is cancelled, or hits its timeout
- the action repeatedly fails to poll the run status, or hits a permanent error such as an invalid API key

Cancellation is best-effort. The action requests the cancellation and exits without
waiting for it to complete, so the run moves to `CANCELLING` and Orchestra confirms
cancellation with any underlying platforms in its own time. If a run gets stuck in
`CANCELLING`, force cancel it from the Orchestra UI.

To leave runs going when the GitHub job stops, set `cancel_on_exit: false`:

```yaml
uses: orchestra-hq/run-pipeline@v1
with:
  api_key: ${{ secrets.ORCHESTRA_API_KEY }}
  pipeline_id: "your-pipeline-id"
  cancel_on_exit: false
```

## Example usage

```yaml
uses: orchestra-hq/run-pipeline@v1
with:
  api_key: ${{ secrets.ORCHESTRA_API_KEY }}
  pipeline_id: "your-pipeline-id"
  task_ids: "task-id-1,task-id-2"
  continue_downstream_run: true
```
