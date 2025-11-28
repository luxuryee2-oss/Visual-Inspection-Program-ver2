import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, 'aria-label': ariaLabel, placeholder, title, ...props }, ref) => {
    // file 타입이거나 숨겨진 입력의 경우 접근성 속성 필수
    const isFileInput = type === 'file';
    const isHidden = className?.includes('hidden') || false;
    
    // file 타입이거나 숨겨진 경우 항상 접근성 속성 필요 (id가 있어도)
    // 일반 입력의 경우 id가 있으면 Label과 연결되어 있으므로 aria-label 불필요
    let computedAriaLabel = ariaLabel;
    if (!computedAriaLabel) {
      if (isFileInput || isHidden) {
        // file 타입이거나 숨겨진 경우 항상 aria-label 필요
        computedAriaLabel = title || placeholder || (isFileInput ? '파일 선택' : '입력 필드');
      } else if (props.id) {
        // 일반 입력이고 id가 있으면 Label과 연결되어 있으므로 aria-label 불필요
        computedAriaLabel = undefined;
      } else {
        // 일반 입력이고 id가 없으면 placeholder나 title을 aria-label로 사용
        computedAriaLabel = placeholder || title;
      }
    }
    
    // file 타입이거나 숨겨진 경우 title도 항상 추가
    const computedTitle = title || (isFileInput || isHidden ? (placeholder || (isFileInput ? '파일 선택' : '입력 필드')) : undefined);
    
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        aria-label={computedAriaLabel}
        placeholder={placeholder}
        title={computedTitle}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
