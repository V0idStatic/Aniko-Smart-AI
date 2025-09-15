declare module "react-router-hash-link" {
  import * as React from "react";
  import { LinkProps } from "react-router-dom";

  export interface HashLinkProps extends LinkProps {
    smooth?: boolean;
    scroll?: (el: HTMLElement) => void;
  }

  export class HashLink extends React.Component<HashLinkProps> {}
}
