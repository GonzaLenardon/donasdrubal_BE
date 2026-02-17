// services/pdf/layout.js

import { PAGE } from './constants.js';

export class LayoutManager {
  constructor(pdfDoc, font) {
    this.pdfDoc = pdfDoc;
    this.font = font;
    this.page = this.createPage();
  }

  createPage() {
    const page = this.pdfDoc.addPage();
    this.cursorY = page.getHeight() - PAGE.margin - PAGE.headerHeight;
    return page;
  }

  ensureSpace(requiredHeight) {
    if (this.cursorY - requiredHeight < PAGE.margin) {
      this.page = this.createPage();
    }
  }

  moveDown(height) {
    this.cursorY -= height;
  }
}
