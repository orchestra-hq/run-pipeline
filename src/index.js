const core = require("@actions/core");
const github = require("@actions/github");

const START_PIPELINE_ENDPT = (pipelineId) =>
  `https://app.getorchestra.io/engine/public/pipelines/${pipelineId}/start`;
const PIPELINE_RUN_ENDPT = (pipelineRunId) =>
  `https://app.getorchestra.io/engine/public/pipeline_runs/${pipelineRunId}/status`;
const LINEAGE_APP_URL = (pipelineRunId) =>
  `https://app.getorchestra.io/pipeline-runs/${pipelineRunId}/lineage`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  try {
    const token = core.getInput("api_key", { required: true });
    const pipelineId = core.getInput("pipeline_id", { required: true });
    const pollInterval = core.getInput("poll_interval");
    const environment = core.getInput("environment");
    
    core.info(`Starting pipeline '${pipelineId}'...`);

    const response = await fetch(START_PIPELINE_ENDPT(pipelineId), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        branch: github.context.ref.replace(/^refs\/heads\//, ""),
        commit: github.context.sha,
        environment
      }),
    });
    
    
    if (!response.ok) {
      core.setFailed(`Failed to start pipeline: ${response.statusText}`);
      return
    }
    const responseData = await response.json();
    const pipelineRunId = responseData.pipelineRunId;
    core.info(
      `Pipeline '${pipelineId}' started with run ID '${pipelineRunId}'`
    );
    core.setOutput("pipeline_run_id", pipelineRunId);
    core.info(`Check pipeline run status...`);

    while (true) {
      await sleep(parseInt(pollInterval) * 1000);

      const response = await fetch(PIPELINE_RUN_ENDPT(pipelineRunId), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        }
      });
      if (!response.ok) {
        core.setFailed(`Failed to poll pipeline: ${response.statusText}`);
        return
      }
      const responseData = await response.json();
      const status = responseData.runStatus;
      const pipelineName = responseData.pipelineName;
      core.info(`Pipeline (${pipelineName}) status: ${status}`);

      if (status === 'FAILED') {
        core.setFailed(`Pipeline failed. See '${LINEAGE_APP_URL(pipelineRunId)}' for details.`);
        return
      }

      if (status === 'CANCELLED') {
        core.setFailed(`Pipeline cancelled in the underlying platform. See '${LINEAGE_APP_URL(pipelineRunId)}' for details.`);
        return
      }
      
      if (status === 'SUCCEEDED') {
        core.info("Pipeline succeeded. Exiting.");
        core.setOutput("status", status);
        core.setOutput("pipeline_name", pipelineName);
        return 
      }

      if (status === 'WARNING') {
        core.warning(`Pipeline ended in warning state: See '${LINEAGE_APP_URL(pipelineRunId)}' for details.`)
        return
      }
    }
  } catch (err) {
    core.setFailed(`Action failed: ${err.message}`);
  }
}

main();
