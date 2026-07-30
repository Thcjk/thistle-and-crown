export class MainMenu {
  private root: HTMLElement | null = null;

  mount(
    host: HTMLElement,
    handlers: {
      onStart: () => void;
      onCredits?: () => void;
    },
  ): void {
    this.unmount();
    this.root = document.createElement("div");
    this.root.className = "screen menu-screen";
    this.root.innerHTML = `
      <div class="menu-panel">
        <h1 class="menu-brand">Thistle &amp; Crown</h1>
        <p class="menu-tagline">Two claims. One Heartstone. A highland vale at war.</p>
        <button class="menu-btn" data-action="start">Start Prototype Match</button>
        <button class="menu-btn secondary" data-action="credits">Vision</button>
        <p class="boot-status">Local prototype · bots · one playable hero</p>
      </div>
    `;
    this.root.querySelector('[data-action="start"]')?.addEventListener("click", handlers.onStart);
    this.root.querySelector('[data-action="credits"]')?.addEventListener("click", () => {
      handlers.onCredits?.();
    });
    host.appendChild(this.root);
  }

  unmount(): void {
    this.root?.remove();
    this.root = null;
  }
}
