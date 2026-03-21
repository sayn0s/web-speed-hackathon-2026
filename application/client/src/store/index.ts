import { combineReducers, legacy_createStore as createStore, Dispatch, UnknownAction } from "redux";

const emptyReducer = (state: unknown = {}) => state;

export const store = createStore(combineReducers({ form: emptyReducer }));

export type RootState = { form: unknown };
export type AppDispatch = Dispatch<UnknownAction>;

let formReducerInjected = false;

export async function ensureFormReducer(): Promise<void> {
  if (formReducerInjected) return;
  formReducerInjected = true;
  const { reducer: formReducer } = await import("redux-form");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  store.replaceReducer(combineReducers({ form: formReducer }) as any);
}
