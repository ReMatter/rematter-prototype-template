import {
  Tabs as AriaTabs,
  TabList as AriaTabList,
  Tab as AriaTab,
  TabPanel as AriaTabPanel,
} from 'react-aria-components'
import type {
  TabsProps as AriaTabsProps,
  TabListProps as AriaTabListProps,
  TabProps as AriaTabProps,
  TabPanelProps as AriaTabPanelProps,
} from 'react-aria-components'
import type { ReactNode } from 'react'

export interface TabsProps extends AriaTabsProps {
  children: ReactNode
}

export function Tabs({ children, className, ...props }: TabsProps) {
  return (
    <AriaTabs className={`tabs ${className ?? ''}`} {...props}>
      {children}
    </AriaTabs>
  )
}

export interface TabListProps<T> extends AriaTabListProps<T> {
  children: ReactNode
}

export function TabList<T extends object>({ children, className, ...props }: TabListProps<T>) {
  return (
    <AriaTabList className={`tab-list ${className ?? ''}`} {...props}>
      {children}
    </AriaTabList>
  )
}

export interface TabProps extends AriaTabProps {
  children: ReactNode
}

export function Tab({ children, className, ...props }: TabProps) {
  return (
    <AriaTab className={`tab ${className ?? ''}`} {...props}>
      {children}
    </AriaTab>
  )
}

export interface TabPanelProps extends AriaTabPanelProps {
  children: ReactNode
}

export function TabPanel({ children, className, ...props }: TabPanelProps) {
  return (
    <AriaTabPanel className={`tab-panel ${className ?? ''}`} {...props}>
      {children}
    </AriaTabPanel>
  )
}

// Convenience component for simple tab configuration
export interface TabItem {
  id: string
  label: ReactNode
  children: ReactNode
}

export interface SimpleTabsProps extends Omit<AriaTabsProps, 'children'> {
  items: TabItem[]
}

export function SimpleTabs({ items, className, ...props }: SimpleTabsProps) {
  return (
    <Tabs className={className} {...props}>
      <TabList>
        {items.map((item) => (
          <Tab key={item.id} id={item.id}>
            {item.label}
          </Tab>
        ))}
      </TabList>
      {items.map((item) => (
        <TabPanel key={item.id} id={item.id}>
          {item.children}
        </TabPanel>
      ))}
    </Tabs>
  )
}
