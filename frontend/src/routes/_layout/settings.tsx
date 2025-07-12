/**
 * @file Defines the UserSettings component.
 * @description Renders a settings page with tabs for user profile, password, appearance, and account deletion.
 * @module UserSettings
 */

import { Container, Heading, Tabs } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"
import type React from "react"
import type { FC } from "react"

import Appearance from "@/components/UserSettings/Appearance"
import ChangePassword from "@/components/UserSettings/ChangePassword"
import DeleteAccount from "@/components/UserSettings/DeleteAccount"
import UserInformation from "@/components/UserSettings/UserInformation"
import useAuth from "@/hooks/useAuth"

// region Type Aliases

/**
 * Interface for a tab configuration.
 * @interface TabConfig
 */
interface TabConfig {
  /** Unique value for the tab. */
  value: string
  /** Display title of the tab. */
  title: string
  /** Component to render for the tab. */
  component: FC
}

/**
 * Type alias for the UserSettings component.
 * @type {UserSettingsComponent}
 */
type UserSettingsComponent = FC

// endregion

// region Main Code

/**
 * Configuration for settings tabs.
 * @constant {TabConfig[]}
 */
const tabsConfig: TabConfig[] = [
  { value: "my-profile", title: "My profile", component: UserInformation },
  { value: "password", title: "Password", component: ChangePassword },
  { value: "appearance", title: "Appearance", component: Appearance },
  { value: "danger-zone", title: "Danger zone", component: DeleteAccount },
]

/**
 * UserSettings component for rendering a settings page with tabs.
 * @returns {React.ReactElement | null} The rendered UserSettings component or null if no user is logged in.
 */
const UserSettings: UserSettingsComponent = (): React.ReactElement | null => {
  const { user: currentUser } = useAuth()
  const finalTabs: TabConfig[] = currentUser?.is_superuser
    ? tabsConfig.filter((tab: TabConfig): boolean => tab.value !== "danger-zone")
    : tabsConfig

  if (!currentUser) {
    return null
  }

  return (
    <main>
      <Container maxW="full">
        <Heading size="lg" textAlign={{ base: "center", md: "left" }} py={12}>
          User Settings
        </Heading>
        <Tabs.Root defaultValue="my-profile" variant="subtle">
          <Tabs.List>
            {finalTabs.map(
              (tab: TabConfig): React.ReactElement => (
                <Tabs.Trigger key={tab.value} value={tab.value} aria-label={`Select ${tab.title} tab`}>
                  {tab.title}
                </Tabs.Trigger>
              ),
            )}
          </Tabs.List>
          {finalTabs.map(
            (tab: TabConfig): React.ReactElement => (
              <Tabs.Content key={tab.value} value={tab.value}>
                <tab.component />
              </Tabs.Content>
            ),
          )}
        </Tabs.Root>
      </Container>
    </main>
  )
}

// endregion

// region Optional Declarations

UserSettings.displayName = "UserSettings"

export const Route = createFileRoute("/_layout/settings")({
  component: UserSettings,
})

// endregion

// noinspection JSUnusedGlobalSymbols
export default UserSettings
