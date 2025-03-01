import { defineConfig } from 'unocss/vite'
import { presetAttributify, presetIcons, presetUno, transformerDirectives } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons(),
  ],
  transformers: [
    transformerDirectives(),
  ],
  theme: {
    colors: {
      brand: {
        DEFAULT: '#FF9155',    // class="bg-brand"
        secondary: '#FFB773',   // class="bg-brand-secondary"
      },
      gray: {
        DEFAULT: '#BFBFBF', // class="bg-gray"
        '100': '#EAEAEA',// class="bg-gray-100"
        '200': '#BFBFBF',// class="bg-gray-200"
        '300': '#959595',// class="bg-gray-300"
        '400': '#6A6A6A',// class="bg-gray-400"
        '500': '#404040',// class="bg-gray-500"
        '600': '#151515',// class="bg-gray-600"
      }
    }
  },
  shortcuts: {
    'flex-row-between': 'flex flex-row items-center justify-between',
    'flex-row-center': 'flex items-center justify-center',
    'box-shadow': 'shadow-[0px_4px_4px_rgba(0,0,0,0.25)]',
    'flex-col-center': 'flex flex-col justify-center'
  },
})
