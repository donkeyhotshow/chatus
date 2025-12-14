
/**
 * @fileoverview Универсальный адаптер для поиска DOM-элементов, включая Shadow DOM,
 * с использованием каскадного поиска и MutationObserver.
 * @module DomObserver
 */

class DomObserver {
  constructor() {
    this.eventListeners = {};
  }

  /**
   * Внутренний механизм Pub/Sub для событий.
   * @param {string} eventName
   * @param {Function} callback
   */
  on(eventName, callback) {
    if (!this.eventListeners[eventName]) {
      this.eventListeners[eventName] = [];
    }
    this.eventListeners[eventName].push(callback);
  }

  /**
   * Отписывается от событий.
   * @param {string} eventName
   * @param {Function} callback
   */
  off(eventName, callback) {
    if (!this.eventListeners[eventName]) {
      return;
    }
    this.eventListeners[eventName] = this.eventListeners[eventName].filter(
      (listener) => listener !== callback
    );
  }

  /**
   * Эмитит событие.
   * @param {string} eventName
   * @param {*} data
   */
  emit(eventName, data) {
    if (this.eventListeners[eventName]) {
      this.eventListeners[eventName].forEach((listener) => listener(data));
    }
  }

  /**
   * Рекурсивно обходит DOM и Shadow DOM для поиска элемента.
   * @param {Node} root
   * @param {Function} predicate - Функция, которая возвращает true, если элемент найден.
   * @param {number} maxDepth - Максимальная глубина поиска.
   * @param {number} currentDepth - Текущая глубина поиска.
   * @returns {Element|null} Найденный элемент или null.
   */
  _traverseDom(root, predicate, maxDepth, currentDepth) {
    if (!root || currentDepth > maxDepth) {
      return null;
    }

    if (predicate(root)) {
      return root;
    }

    // Обход дочерних элементов
    for (const child of root.children || []) {
      const found = this._traverseDom(child, predicate, maxDepth, currentDepth + 1);
      if (found) {
        return found;
      }
    }

    // Обход Shadow DOM
    if (root.shadowRoot) {
      for (const child of root.shadowRoot.children || []) {
        const found = this._traverseDom(child, predicate, maxDepth, currentDepth + 1);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  /**
   * Каскадный поиск кнопки.
   * @param {Object} options - Опции поиска.
   * @param {string[]} [options.aria] - Массив значений для aria-label/aria-labelledby.
   * @param {string[]} [options.svgPaths] - Массив SVG-путей (атрибут 'd').
   * @param {string[]} [options.texts] - Массив текстовых значений кнопки.
   * @param {string[]} [options.selectors] - Массив CSS-селекторов.
   * @param {Node} [options.root=document] - Корневой элемент для поиска.
   * @param {number} [options.maxDepth=10] - Максимальная глубина DOM-поиска.
   * @returns {Element|null} Найденный элемент или null.
   */
  _findButton(options) {
    const {
      aria = [],
      svgPaths = [],
      texts = [],
      selectors = [],
      root = document,
      maxDepth = 10,
    } = options;

    const normalizeText = (text) => text.replace(/\s+/g, ' ').trim();

    // 1. Поиск по aria-label
    for (const label of aria) {
      const predicate = (el) =>
        el.nodeType === Node.ELEMENT_NODE &&
        (normalizeText(el.getAttribute('aria-label') || '') === normalizeText(label) ||
          (el.id &&
            el.ownerDocument &&
            normalizeText(
              el.ownerDocument.querySelector(`[aria-labelledby="${el.id}"]`)?.textContent || ''
            ) === normalizeText(label)));
      const found = this._traverseDom(root, predicate, maxDepth, 0);
      if (found) return found;
    }

    // 2. Поиск по SVG-иконкам
    for (const svgPath of svgPaths) {
      const predicate = (el) =>
        el.nodeType === Node.ELEMENT_NODE &&
        (el.tagName === 'path' && el.getAttribute('d')?.includes(svgPath)) ||
        (el.querySelector('path') && el.querySelector('path').getAttribute('d')?.includes(svgPath));
      const found = this._traverseDom(root, predicate, maxDepth, 0);
      if (found) return found;
    }

    // 3. Поиск по тексту кнопки
    for (const text of texts) {
      const predicate = (el) =>
        el.nodeType === Node.ELEMENT_NODE && normalizeText(el.textContent || '') === normalizeText(text);
      const found = this._traverseDom(root, predicate, maxDepth, 0);
      if (found) return found;
    }

    // 4. Поиск по CSS-селекторам
    for (const selector of selectors) {
      const predicate = (el) =>
        el.nodeType === Node.ELEMENT_NODE && el.matches(selector);
      const found = this._traverseDom(root, predicate, maxDepth, 0);
      if (found) return found;
    }

    return null;
  }

  /**
   * Ищет кнопку с помощью каскадной стратегии и MutationObserver.
   * Возвращает Promise, который разрешается найденным элементом или null после таймаута.
   * @param {Object} options - Опции поиска.
   * @param {number} [options.timeout=5000] - Максимальное время ожидания в мс.
   * @param {number} [options.interval=100] - Интервал повторных попыток в мс.
   * @param {Node} [options.observerRoot=document.body] - Корневой элемент для MutationObserver.
   * @param {Object} [options.observerConfig] - Конфигурация MutationObserver.
   * @returns {Promise<Element|null>}
   */
  findButton(options) {
    const { timeout = 5000, interval = 100, observerRoot = document.body, observerConfig = { childList: true, subtree: true }, ...searchOptions } = options;

    return new Promise((resolve) => {
      let foundElement = null;
      let observer = null;
      let timeoutId = null;

      const attemptSearch = () => {
        foundElement = this._findButton(searchOptions);
        if (foundElement) {
          this.emit('found', foundElement);
          cleanup();
          resolve(foundElement);
        }
      };

      const cleanup = () => {
        if (observer) {
          observer.disconnect();
        }
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };

      // Начальная попытка поиска
      attemptSearch();
      if (foundElement) return; // Если найдено сразу, то завершаем

      // Настройка MutationObserver
      observer = new MutationObserver(() => {
        attemptSearch();
      });
      observer.observe(observerRoot, observerConfig);

      // Установка таймаута
      timeoutId = setTimeout(() => {
        this.emit('timeout', null);
        cleanup();
        resolve(null);
      }, timeout);
    });
  }

  /**
   * Наблюдает за кнопкой и вызывает callback при ее обнаружении.
   * @param {Object} options - Опции поиска.
   * @param {Function} callback - Колбэк, вызываемый при нахождении элемента.
   * @returns {Function} Функция для прекращения наблюдения.
   */
  observeButton(options, callback) {
    const { observerRoot = document.body, observerConfig = { childList: true, subtree: true }, ...searchOptions } = options;
    let observer = null;
    let foundElement = null;

    const attemptSearch = () => {
      foundElement = this._findButton(searchOptions);
      if (foundElement) {
        callback(foundElement);
        this.emit('found', foundElement);
        // Можно отключить observer здесь, если нужно найти только один раз
        // if (observer) observer.disconnect();
      }
    };

    attemptSearch(); // Начальная попытка

    observer = new MutationObserver(() => {
      if (!foundElement) { // Ищем только если еще не нашли
        attemptSearch();
      }
    });
    observer.observe(observerRoot, observerConfig);

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }
}

export const domObserver = new DomObserver();
export const findButton = (...args) => domObserver.findButton(...args);
export const observeButton = (...args) => domObserver.observeButton(...args);
