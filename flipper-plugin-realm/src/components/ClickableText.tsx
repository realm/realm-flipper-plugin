import React from "react";
import { useState } from "react";

type ClickableTextProps = {
    /** Content to be displayed for the given value. */
    displayValue: string | number | JSX.Element;
    ellipsis?: boolean;
    onClick: VoidFunction;
  };
  
  /**  Functional component to render clickable text which opens the DataInspector.*/
 export const ClickableText = ({
    displayValue,
    ellipsis = false,
    onClick,
  }: ClickableTextProps) => {
    const [isHovering, setHovering] = useState(false);
    return (
      <div>
        <div
          style={{
            cursor: 'pointer',
            display: 'inline',
            color: ellipsis ? undefined : '#6831c7',
            textDecoration: isHovering ? 'underline' : undefined,
          }}
          onClick={onClick}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          {displayValue}
        {ellipsis ? (
          <div
            style={{
              display: 'inline',
            }}
          >
            ...
          </div>
        ) : null}
        </div>
      </div>
    );
  };
