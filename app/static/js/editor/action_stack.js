class ActionStack {
  constructor(actions, onChange) {
    this.actions = actions;
    this.onChange = onChange;
    this.undoStack = [];
    this.redoStack = [];

    document.body.addEventListener('keyup', this.handleKey.bind(this));
  }

  reset() {
    this.undoStack = [];
    this.redoStack = [];
  }

  // Add an action to the undo stack.
  // This resets the redo stack.
  push(action) {
    this.redoStack = [];
    this.undoStack.push(action);
  }

  exec(type, action) {
    this.actions[type].redo(action);
    this.push({
      type, ...action
    });
    this.onChange();
  }

  handleKey(ev) {
    // Redo (Ctrl+Shift+Z)
    if (ev.ctrlKey && ev.key == 'Z') {
      let lastAction = this.redoStack.pop();
      if (!lastAction) return;
      this.actions[lastAction.type].redo(lastAction);
      this.undoStack.push(lastAction);
      this.onChange();

    // Undo (Ctrl+Z)
    } else if (ev.ctrlKey && ev.key == 'z') {
      let lastAction = this.undoStack.pop();
      if (!lastAction) return;
      this.actions[lastAction.type].undo(lastAction);
      this.redoStack.push(lastAction);
      this.onChange();
    }
  }
}

export default ActionStack
