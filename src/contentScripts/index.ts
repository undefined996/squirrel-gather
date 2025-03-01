/* eslint-disable no-console */
import { createApp } from 'vue'
import App from './views/App.vue'
import { setupApp } from '~/logic/common-setup'
import { Toaster } from 'vue-sonner';



// Firefox `browser.tabs.executeScript()` requires scripts return a primitive value
(() => {
  // mount component to context window
  const container = document.createElement('div')
  container.id = __NAME__
  const root = document.createElement('div')
  const styleEl = document.createElement('link')
  const shadowDOM = container.attachShadow?.({ mode: __DEV__ ? 'open' : 'closed' }) || container
  styleEl.setAttribute('rel', 'stylesheet')
  styleEl.setAttribute('href', browser.runtime.getURL('dist/contentScripts/style.css'))
  shadowDOM.appendChild(styleEl)

  shadowDOM.appendChild(root)
  document.body.appendChild(container)

  const app = createApp(App)


  // 挂载 vue-sonner 的 Toaster 组件到全局 document.body
  const toasterContainer = document.createElement('div');
  toasterContainer.id = 'vue-sonner-container';
  document.body.appendChild(toasterContainer);

  const toasterApp = createApp({
    render: () => h(Toaster, {
      richColors: true, position: 'top-center'
    }),
  });
  toasterApp.mount(toasterContainer);


  setupApp(app)
  app.mount(root)
})()