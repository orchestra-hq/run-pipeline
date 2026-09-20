const orchestraEnv = process.env.ORCHESTRA_ENV || "app";

const API_BASE_URL = `https://${orchestraEnv}.getorchestra.io/api/engine/public`;

const START_PIPELINE_ENDPT = (pipelineId) =>
  `${API_BASE_URL}/pipelines/${pipelineId}/start`;
const PIPELINE_RUN_ENDPT = (pipelineRunId) =>
  `${API_BASE_URL}/pipeline_runs/${pipelineRunId}/status`;
const CANCEL_PIPELINE_RUN_ENDPT = (pipelineRunId) =>
  `${API_BASE_URL}/pipeline_runs/${pipelineRunId}/cancel`;
const LINEAGE_APP_URL = (pipelineRunId) =>
  `https://${orchestraEnv}.getorchestra.io/pipeline-runs/${pipelineRunId}/lineage`;

const readErrorMessage = async (response) => {
  let errorMessage = await response.text();
  try {
    const responseData = JSON.parse(errorMessage);
    if (responseData?.detail instanceof Object) {
      errorMessage = JSON.stringify(responseData?.detail);
    } else if (responseData?.message instanceof Object) {
      errorMessage = JSON.stringify(responseData?.message);
    } else if (responseData?.error instanceof Object) {
      errorMessage = JSON.stringify(responseData?.error);
    } else {
      errorMessage =
        responseData?.detail ??
        responseData?.message ??
        responseData?.error ??
        errorMessage;
    }
  } catch (err) {}

  return errorMessage;
};

module.exports = {
  START_PIPELINE_ENDPT,
  PIPELINE_RUN_ENDPT,
  CANCEL_PIPELINE_RUN_ENDPT,
  LINEAGE_APP_URL,
  readErrorMessage,
};
