const core = require("@actions/core");
const github = require("@actions/github");

const {
  START_PIPELINE_ENDPT,
  PIPELINE_RUN_ENDPT,
  LINEAGE_APP_URL,
  readErrorMessage,
} = require("./api");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const parseJson = (input) => {
  if (!input?.trim()) {
    return;
  }

  try {
    return JSON.parse(input);
  } catch (err) {
    throw new Error(`Failed to parse input as JSON: ${err.message}`);
  }
};

async function main() {
  try {
    const token = core.getInput("api_key", { required: true });
    const pipelineId = core.getInput("pipeline_id", { required: true });
    const pollInterval = core.getInput("poll_interval");
    const environment = core.getInput("environment");
    const retryFromFailed =
      core.getInput("retry_from_failed").toLowerCase() === "true";
    const continueDownstreamRun =
      core.getInput("continue_downstream_run").toLowerCase() === "true";
    const taskIds = core.getInput("task_ids")
      ? core.getInput("task_ids").split(",")
      : null;
    const runInputs = parseJson(core.getInput("run_inputs"));
    const branchInput = core.getInput("branch");

    core.info(`Starting pipeline '${pipelineId}'...`);

    const response = await fetch(START_PIPELINE_ENDPT(pipelineId), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        branch: branchInput || github.context.ref.replace(/^refs\/heads\//, ""),
        commit: branchInput ? null : github.context.sha,
        environment,
        ciRunId: github.context.runId.toString(),
        retryFromFailed,
        taskIds,
        continueDownstreamRun,
        runInputs,
      }),
    });

    if (!response.ok) {
      const errorMessage = await readErrorMessage(response);

      core.error(
        `Failed to start pipeline: (HTTP ${response.status} ${response.statusText})\nURL: ${response.url}\nError: ${errorMessage}`
      );
      core.setFailed("Pipeline start failed");
      return;
    }
    const responseData = await response.json();
    const pipelineRunId = responseData.pipelineRunId;
    core.info(
      `Pipeline '${pipelineId}' started with run ID '${pipelineRunId}'`
    );
    core.info(`See '${LINEAGE_APP_URL(pipelineRunId)}' for details.`);
    core.setOutput("pipeline_run_id", pipelineRunId);
    core.info(`Check pipeline run status...`);

    while (true) {
      await sleep(parseInt(pollInterval) * 1000);

      const response = await fetch(PIPELINE_RUN_ENDPT(pipelineRunId), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        core.setFailed(`Failed to poll pipeline: ${response.statusText}`);
        return;
      }
      const responseData = await response.json();
      const status = responseData.runStatus;
      const pipelineName = responseData.pipelineName;

      core.info(`Pipeline status: ${status}`);

      if (status === "FAILED") {
        core.setFailed(`Pipeline '${pipelineName}' failed`);
        return;
      }

      if (status === "CANCELLED") {
        core.setFailed(
          `Pipeline '${pipelineName}'cancelled in the underlying platform.`
        );
        return;
      }

      if (status === "SUCCEEDED") {
        core.info(`Pipeline '${pipelineName}' succeeded.`);
        core.setOutput("status", status);
        core.setOutput("pipeline_name", pipelineName);
        return;
      }

      if (status === "WARNING") {
        core.warning(`Pipeline '${pipelineName}' ended in warning state.`);
        core.setOutput("status", status);
        core.setOutput("pipeline_name", pipelineName);
        return;
      }

      if (status === "SKIPPED") {
        core.warning(
          `Pipeline '${pipelineName}' run was skipped, likely because the pipeline's concurrency limit was reached.`
        );
        core.setOutput("status", status);
        core.setOutput("pipeline_name", pipelineName);
        return;
      }
    }
  } catch (err) {
    core.setFailed(`Action failed: ${err.message}`);
  }
}

main();
