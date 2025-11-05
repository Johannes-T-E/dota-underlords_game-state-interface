function generateDetailedDiagram() {
    return `
flowchart TD

    %% Entry Point
    node0{receive_gsi_data}:::entry
    node1{process_gsi_data<br/><small>Raw GSI Payload (JSON)</small>}:::decision
    node2{get_account_id<br/><small>Raw GSI Player State (dict)</small>}:::extract
    node3[is_valid_new_player<br/><small>Raw GSI Player State (dict)</small>]:::validate
    node4{cleanup_buffers}:::decision
    node5{start_new_match}:::decision
    node6{process_buffered_data}:::decision
    node7[process_and_store_gsi_private_player_state<br/><small>Raw GSI Player State (dict)</small>]:::transform
    node8[process_and_store_gsi_public_player_state<br/><small>Raw GSI Player State (dict)</small>]:::transform
    node9{check_match_end}:::validate
    node10{abandon_match}:::decision
    node11{emit_realtime_update}:::storage
    node12{db_writer_worker}:::storage

    %% Flow Connections
    node0 --> node1
    node1 --> node2
    node2 --> node3
    node3 --> node4
    node4 --> node5
    node5 --> node6
    node6 --> node7
    node7 --> node8
    node8 --> node9
    node9 --> node10
    node10 --> node11
    node11 --> node12

    %% Styling
    classDef entryStyle fill:${getColor('entry')},stroke:${getColor('entry-stroke')},stroke-width:2px,color:#fff
    classDef extractStyle fill:${getColor('extract')},stroke:${getColor('extract-stroke')},stroke-width:2px,color:#fff
    classDef validateStyle fill:${getColor('validate')},stroke:${getColor('validate-stroke')},stroke-width:2px,color:#fff
    classDef transformStyle fill:${getColor('transform')},stroke:${getColor('transform-stroke')},stroke-width:2px,color:#fff
    classDef decisionStyle fill:${getColor('decision')},stroke:${getColor('decision-stroke')},stroke-width:2px,color:#fff
    classDef storageStyle fill:${getColor('storage')},stroke:${getColor('storage-stroke')},stroke-width:2px,color:#fff
`;
}