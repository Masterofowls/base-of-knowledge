// path: src/shared/ui/VirtualListbox.tsx
import * as React from 'react'
import { FixedSizeList, ListChildComponentProps } from 'react-window'

const LISTBOX_PADDING = 8 // px

function renderRow(props: ListChildComponentProps) {
  const { data, index, style } = props as any
  const dataSet = data[index]
  const inlineStyle = {
    ...style,
    top: (style.top as number) + LISTBOX_PADDING,
  }
  return (
    <div style={inlineStyle} key={index} {...dataSet[0]}>
      {dataSet[1]}
    </div>
  )
}

// MUI Autocomplete virtualized ListboxComponent
export const VirtualListbox = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLElement>>(function VirtualListbox(props, ref) {
  const { children, ...other } = props
  const itemData: Array<any> = []
  // Flatten the children (MUI provides [props, option] tuples)
  (children as any[]).forEach((item) => {
    itemData.push(item)
  })
  const ITEM_SIZE = 36
  const height = Math.min(8, itemData.length) * ITEM_SIZE + 2 * LISTBOX_PADDING

  return (
    <div ref={ref} {...other}>
      <FixedSizeList
        itemData={itemData}
        height={height}
        width='100%'
        itemSize={ITEM_SIZE}
        overscanCount={5}
        itemCount={itemData.length}
      >
        {renderRow}
      </FixedSizeList>
    </div>
  )
})


