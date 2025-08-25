
declare module 'react-quill' {
  import * as React from 'react';

  export interface ReactQuillProps {
    value?: string;
    onChange?: (content: string, delta: any, source: string, editor: any) => void;
    readOnly?: boolean;
    theme?: string;
    modules?: { [key: string]: any };
    formats?: string[];
    placeholder?: string;
    style?: React.CSSProperties;
    className?: string;
  }

  const ReactQuill: React.ComponentType<ReactQuillProps>;
  export default ReactQuill;
}
