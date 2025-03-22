import React from 'react'
import { RoutingProfile } from '@/api/graphhopper'
import CustomModelBox from '@/sidebar/CustomModelBox'

export default function ({
    routingProfiles,
    selectedProfile,
    showCustomModelBox,
    toggleCustomModelBox,
    customModelBoxEnabled,
    customModelStr,
    encodedValues,
}: {
    routingProfiles: RoutingProfile[]
    selectedProfile: RoutingProfile
    showCustomModelBox: boolean
    toggleCustomModelBox: () => void
    customModelBoxEnabled: boolean
    customModelStr: string
    encodedValues: object[]
}) {
    return (
        <>
            {showCustomModelBox && (
                <CustomModelBox
                    customModelEnabled={customModelBoxEnabled}
                    customModelStr={customModelStr}
                    queryOngoing={false}
                    drawAreas={false}
                    encodedValues={encodedValues}
                />
            )}
        </>
    )
}
