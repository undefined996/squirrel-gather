import antfu from '@antfu/eslint-config'

export default antfu(
  {
    rules: {
      // 禁用 Vue 模板中单行元素内容的换行规则
      'vue/singleline-html-element-content-newline': ['off'],
      'indent': ['error', 2, { SwitchCase: 1, Ternary: 'always' }],
    },
  },
)
