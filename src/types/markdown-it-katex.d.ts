declare module 'markdown-it-katex' {
  import MarkdownIt from 'markdown-it';
  
  interface KatexOptions {
    throwOnError?: boolean;
    errorColor?: string;
    [key: string]: any;
  }
  
  function markdownItKatex(options?: KatexOptions): MarkdownIt.PluginSimple;
  
  export = markdownItKatex;
}