export interface StateContext {
  dt: number;
}

export interface State<TContext extends StateContext> {
  name: string;
  enter?(context: TContext): void;
  update(context: TContext): string | null;
  exit?(context: TContext): void;
}

export class StateMachine<TContext extends StateContext> {
  private states = new Map<string, State<TContext>>();
  private currentName: string;

  constructor(initial: string) {
    this.currentName = initial;
  }

  add(state: State<TContext>): void {
    this.states.set(state.name, state);
  }

  get current(): string {
    return this.currentName;
  }

  setState(name: string, context: TContext): void {
    if (name === this.currentName) return;
    const prev = this.states.get(this.currentName);
    const next = this.states.get(name);
    if (!next) return;
    prev?.exit?.(context);
    this.currentName = name;
    next.enter?.(context);
  }

  update(context: TContext): void {
    const state = this.states.get(this.currentName);
    if (!state) return;
    const next = state.update(context);
    if (next && next !== this.currentName) {
      this.setState(next, context);
    }
  }
}
