// src/services/pdfMutex.js
let locked = false;
const queue = [];

export async function acquireLock() {
  if (!locked) {
    locked = true;
    return;
  }

  await new Promise(resolve => queue.push(resolve));
}

export function releaseLock() {
  if (queue.length > 0) {
    const next = queue.shift();
    next();
  } else {
    locked = false;
  }
}
