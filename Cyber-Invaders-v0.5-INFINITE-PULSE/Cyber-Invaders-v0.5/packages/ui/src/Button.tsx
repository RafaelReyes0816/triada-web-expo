import type { ButtonHTMLAttributes } from 'react'

export function Button({
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} {...rest} />
}
