/**
 * @file Defines the CancelablePromise class and related utilities for cancellable promises.
 * @description Extends the Promise API with cancellation support, allowing API requests to be aborted with a custom CancelError.
 * @module CancelablePromise
 */

// region Type Aliases

/**
 * Interface for the onCancel handler used in CancelablePromise.
 * @interface OnCancel
 */
export interface OnCancel {
  /** Indicates if the promise has been resolved. */
  readonly isResolved: boolean
  /** Indicates if the promise has been rejected. */
  readonly isRejected: boolean
  /** Indicates if the promise has been cancelled. */
  readonly isCancelled: boolean
  /**
   * Registers a cancellation handler.
   * @param cancelHandler - The function to execute on cancellation.
   * @returns {void}
   */
  (cancelHandler: () => void): void
}

// endregion

// region Main Code

// noinspection JSUnusedGlobalSymbols
/**
 * Custom error class for promise cancellation.
 * @class CancelError
 * @extends Error
 */
export class CancelError extends Error {
  /**
   * Creates an instance of CancelError.
   * @param {string} message - The error message.
   */
  constructor(message: string) {
    super(message)
    this.name = "CancelError"
  }

  /**
   * Indicates that the error is due to cancellation.
   * @returns {boolean} Always true for CancelError.
   */
  public get isCancelled(): boolean {
    return true
  }
}

// noinspection JSUnusedGlobalSymbols
/**
 * A promise that can be cancelled, extending the standard Promise API.
 * @template T - The type of the resolved value.
 * @class CancelablePromise
 * @implements {Promise<T>}
 */
export class CancelablePromise<T> implements Promise<T> {
  /** Indicates if the promise has been resolved. */
  private _isResolved: boolean
  /** Indicates if the promise has been rejected. */
  private _isRejected: boolean
  /** Indicates if the promise has been cancelled. */
  private _isCancelled: boolean
  /** Array of cancellation handlers. */
  readonly cancelHandlers: Array<() => void>
  /** The underlying standard Promise. */
  readonly promise: Promise<T>
  /** Resolve function of the underlying Promise. */
  private _resolve?: (value: T | PromiseLike<T>) => void
  /** Reject function of the underlying Promise. */
  private _reject?: (reason?: unknown) => void

  /**
   * Creates an instance of CancelablePromise.
   * @param executor - Function that defines the promise behavior with resolve, reject, and cancel handlers.
   */
  constructor(
    executor: (
      resolve: (value: T | PromiseLike<T>) => void,
      reject: (reason?: unknown) => void,
      onCancel: OnCancel,
    ) => void,
  ) {
    this._isResolved = false
    this._isRejected = false
    this._isCancelled = false
    this.cancelHandlers = []
    this.promise = new Promise<T>((resolve, reject) => {
      this._resolve = resolve
      this._reject = reject

      const onResolve = (value: T | PromiseLike<T>): void => {
        if (this.isDone()) {
          return
        }
        this._isResolved = true
        if (this._resolve) this._resolve(value)
      }

      const onReject = (reason?: unknown): void => {
        if (this.isDone()) {
          return
        }
        this._isRejected = true
        if (this._reject) this._reject(reason)
      }

      const onCancel = (cancelHandler: () => void): void => {
        if (this.isDone()) {
          return
        }
        this.cancelHandlers.push(cancelHandler)
      }

      Object.defineProperty(onCancel, "isResolved", {
        get: (): boolean => this._isResolved,
      })

      Object.defineProperty(onCancel, "isRejected", {
        get: (): boolean => this._isRejected,
      })

      Object.defineProperty(onCancel, "isCancelled", {
        get: (): boolean => this._isCancelled,
      })

      return executor(onResolve, onReject, onCancel as OnCancel)
    })
  }

  /**
   * Gets the string tag for the promise.
   * @returns {string} The string tag 'Cancellable Promise'.
   */
  get [Symbol.toStringTag](): string {
    return "Cancellable Promise"
  }

  /**
   * Attaches callbacks for the resolution and/or rejection of the promise.
   * @template TResult1 - The type of the fulfilled result.
   * @template TResult2 - The type of the rejected result.
   * @param onFulfilled - The callback to execute when the promise is fulfilled.
   * @param onRejected - The callback to execute when the promise is rejected.
   * @returns {Promise<TResult1 | TResult2>} A new promise with the specified handlers.
   */

  // biome-ignore lint/suspicious/noThenProperty: <explanation>
  public then<TResult1 = T, TResult2 = never>(
    onFulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.promise.then(onFulfilled, onRejected)
  }

  // noinspection JSValidateJSDoc
  /**
   * Attaches a callback for the rejection of the promise.
   * @template TResult - The type of the rejected result.
   * @param onRejected - The callback to execute when the promise is rejected.
   * @returns {Promise<T | TResult>} A new promise with the specified handler.
   */
  public catch<TResult = never>(
    onRejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null,
  ): Promise<T | TResult> {
    return this.promise.catch(onRejected)
  }

  /**
   * Attaches a callback to execute when the promise is settled.
   * @param onFinally - The callback to execute when the promise is settled.
   * @returns {Promise<T>} A new promise with the specified handler.
   */
  public finally(onFinally?: (() => void) | null): Promise<T> {
    return this.promise.finally(onFinally)
  }

  /**
   * Cancels the promise, triggering all registered cancellation handlers.
   * @returns {void}
   */
  public cancel(): void {
    if (this.isDone()) {
      return
    }
    this._isCancelled = true
    this.cancelHandlers.length = 0 // Clear handlers first
    for (const cancelHandler of this.cancelHandlers) {
      try {
        cancelHandler()
      } catch (error) {
        console.warn("Cancellation handler threw an error", error)
      }
    }
    if (this._reject) {
      this._reject(new CancelError("Request aborted"))
    }
  }

  /**
   * Indicates whether the promise is cancelled.
   * @returns {boolean} True if the promise is cancelled, false otherwise.
   */
  public get isCancelled(): boolean {
    return this._isCancelled
  }

  /**
   * Checks if the promise is in a final state (resolved, rejected, or cancelled).
   * @returns {boolean} True if the promise is done, false otherwise.
   */
  private isDone(): boolean {
    return this._isResolved || this._isRejected || this._isCancelled
  }
}

// endregion
