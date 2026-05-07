import type {
  FunctionRunResult,
  RunInput
} from "../generated/api";

const NO_CHANGES: FunctionRunResult = {
  operations: [],
};

export function run(input: RunInput): FunctionRunResult {
  return NO_CHANGES;
}