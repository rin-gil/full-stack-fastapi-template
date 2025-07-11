/**
 * @file Defines custom Skeleton components for loading states.
 * @description Provides Chakra UI-based skeleton components for rectangular, circular, and text placeholders.
 * @module Skeleton
 */

"use client"

import {
  Skeleton as ChakraSkeleton,
  type SkeletonProps as ChakraSkeletonProps,
  Circle,
  type CircleProps,
  Stack,
  type StackProps,
} from "@chakra-ui/react"
import * as React from "react"
import type { FC, ForwardedRef } from "react"

// region Type Aliases

/**
 * Props for the SkeletonCircle component.
 * @interface SkeletonCircleProps
 */
interface SkeletonCircleProps extends ChakraSkeletonProps {
  /** Size of the circular skeleton. */
  size?: CircleProps["size"]
}

/**
 * Props for the SkeletonText component.
 * @interface SkeletonTextProps
 */
interface SkeletonTextProps extends ChakraSkeletonProps {
  /** Number of skeleton lines to display. */
  noOfLines?: number
  /** Gap between skeleton lines. */
  gap?: StackProps["gap"]
}

/**
 * Type alias for the Skeleton component.
 * @type {SkeletonComponent}
 */
type SkeletonComponent = FC<ChakraSkeletonProps>

/**
 * Type alias for the SkeletonCircle component.
 * @type {SkeletonCircleComponent}
 */
type SkeletonCircleComponent = FC<SkeletonCircleProps>

/**
 * Type alias for the SkeletonText component.
 * @type {SkeletonTextComponent}
 */
type SkeletonTextComponent = FC<SkeletonTextProps>

// endregion

// region Main Code

/**
 * Skeleton component for rendering rectangular placeholders.
 * @type {SkeletonComponent}
 */
export const Skeleton: SkeletonComponent = ChakraSkeleton

/**
 * SkeletonCircle component for rendering circular placeholders.
 * @param {SkeletonCircleProps} props - Props for the component.
 * @param {React.Ref<HTMLDivElement>} ref - Reference to the component.
 * @returns {React.ReactElement} The rendered SkeletonCircle component.
 */
export const SkeletonCircle: SkeletonCircleComponent = React.forwardRef<HTMLDivElement, SkeletonCircleProps>(
  function SkeletonCircle(props: SkeletonCircleProps, ref: ForwardedRef<HTMLDivElement>): React.ReactElement {
    const { size, ...rest } = props
    return (
      <Circle size={size} ref={ref}>
        <ChakraSkeleton {...rest} />
      </Circle>
    )
  },
)

/**
 * SkeletonText component for rendering text placeholder lines.
 * @param {SkeletonTextProps} props - Props for the component.
 * @param {React.Ref<HTMLDivElement>} ref - Reference to the component.
 * @returns {React.ReactElement} The rendered SkeletonText component.
 */
export const SkeletonText: SkeletonTextComponent = React.memo(
  React.forwardRef<HTMLDivElement, SkeletonTextProps>(function SkeletonText(
    props: SkeletonTextProps,
    ref: ForwardedRef<HTMLDivElement>,
  ): React.ReactElement {
    const { noOfLines = 3, gap, ...rest } = props
    return (
      <Stack gap={gap} width="full" ref={ref}>
        {Array(noOfLines)
          .fill(0)
          .map(
            (_: any, index: number): React.ReactElement => (
              <ChakraSkeleton height="4" key={index} {...rest} _last={{ maxW: "80%" }} />
            ),
          )}
      </Stack>
    )
  }),
)

// endregion

// region Optional Declarations

Skeleton.displayName = "Skeleton"
SkeletonCircle.displayName = "SkeletonCircle"
SkeletonText.displayName = "SkeletonText"

// endregion
