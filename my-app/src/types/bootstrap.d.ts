declare module "bootstrap/js/dist/modal" {
  export default class Modal {
    constructor(element: HTMLElement, options?: any);
    static getInstance(element: HTMLElement): Modal | null;
    show(): void;
    hide(): void;
    dispose(): void;
  }
}
