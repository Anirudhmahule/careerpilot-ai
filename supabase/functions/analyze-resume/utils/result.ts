export type Success<T> = { type: 'success'; data: T };
export type Failure<E> = { type: 'failure'; error: E };

export type Result<T, E = Error> = Success<T> | Failure<E>;

export const success = <T>(data: T): Success<T> => ({ type: 'success', data });
export const failure = <E>(error: E): Failure<E> => ({ type: 'failure', error });
