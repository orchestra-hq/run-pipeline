const core = require("@actions/core");

const { CANCEL_PIPELINE_RUN_ENDPT, readErrorMessage } = require("./api");

// Runs as the action's `post` step, which GitHub executes even when the job is
// cancelled. If the pipeline run never reached a terminal status, the run is
// still going in Orchestra, so cancel it rather than leaving it orphaned.
async function cancelPipelineRun() {
  try {
    const pipelineRunId = core.getState("pipelineRunId");
    if (!pipelineRunId) {
      return;
    }

    if (core.getState("runFinished") === "true") {
      return;
    }

    const cancelOnExit =
      core.getInput("cancel_on_exit").trim().toLowerCase() !== "false";
    if (!cancelOnExit) {
      core.info(
        `Leaving pipeline run '${pipelineRunId}' running as 'cancel_on_exit' is false.`
      );
      return;
    }

    const token = core.getInput("api_key", { required: true });

    core.info(`Cancelling pipeline run '${pipelineRunId}'...`);

    const response = await fetch(CANCEL_PIPELINE_RUN_ENDPT(pipelineRunId), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      core.warning(
        `Failed to cancel pipeline run '${pipelineRunId}': (HTTP ${
          response.status
        } ${response.statusText})\nError: ${await readErrorMessage(response)}`
      );
      return;
    }

    core.info(
      `Pipeline run '${pipelineRunId}' is cancelling. Orchestra may take a moment to confirm cancellation with any underlying platforms.`
    );
  } catch (err) {
    // Never fail the post step - that would turn a clean cancellation into a
    // failed job.
    core.warning(`Failed to cancel pipeline run: ${err.message}`);
  }
}

cancelPipelineRun();
