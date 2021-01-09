import InitialExecutionContext from './InitialExecutionContext';
import ResponseExecutionContext from './ResponseExecutionContext';

type ExecutionContext = ResponseExecutionContext | InitialExecutionContext;
export default ExecutionContext;
