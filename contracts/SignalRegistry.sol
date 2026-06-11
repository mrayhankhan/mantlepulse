// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IAgentIdentityRegistry {
    function agentAddressOf(uint256 agentId) external view returns (address);
}

/// @title SignalRegistry
/// @notice On-chain registry of AI-generated Mantle DeFi protocol-health signals.
///         This is MantlePulse's on-chain AI function: the off-chain agent computes
///         a health score, risk score, and anomaly flag per protocol, then records
///         it here — creating a permanent, verifiable benchmark of agent decisions
///         on Mantle (on-chain AI benchmarking).
/// @dev    Only the operator address bound to an AgentID (in the identity registry)
///         may record signals for that agent, so every signal is attributable.
contract SignalRegistry {
    struct Signal {
        uint256 agentId;
        bytes32 protocol; // short label, e.g. bytes32("merchant-moe")
        uint16 healthScore; // 0..10000 basis points (10000 = 100.00%)
        uint16 riskScore; // 0..10000 basis points
        bool anomaly; // true if the agent flagged an anomaly this interval
        bytes32 dataHash; // hash of off-chain evidence snapshot, for auditability
        uint64 timestamp;
    }

    IAgentIdentityRegistry public immutable identity;

    Signal[] private _signals;
    mapping(bytes32 => uint256) private _latestIndexPlusOne; // protocol -> index+1 (0 = none)
    bytes32[] private _protocols;
    mapping(bytes32 => bool) private _seenProtocol;

    event SignalRecorded(
        uint256 indexed signalId,
        uint256 indexed agentId,
        bytes32 indexed protocol,
        uint16 healthScore,
        uint16 riskScore,
        bool anomaly,
        bytes32 dataHash,
        uint64 timestamp
    );

    constructor(address identityRegistry) {
        require(identityRegistry != address(0), "identity=0");
        identity = IAgentIdentityRegistry(identityRegistry);
    }

    modifier onlyAgentOperator(uint256 agentId) {
        require(identity.agentAddressOf(agentId) == msg.sender, "not agent operator");
        _;
    }

    /// @notice Record a protocol-health signal on-chain. Caller must be the
    ///         operator address registered for `agentId`.
    function recordSignal(
        uint256 agentId,
        bytes32 protocol,
        uint16 healthScore,
        uint16 riskScore,
        bool anomaly,
        bytes32 dataHash
    ) external onlyAgentOperator(agentId) returns (uint256 signalId) {
        require(healthScore <= 10000 && riskScore <= 10000, "score>100%");
        require(protocol != bytes32(0), "protocol=0");

        signalId = _signals.length;
        _signals.push(
            Signal({
                agentId: agentId,
                protocol: protocol,
                healthScore: healthScore,
                riskScore: riskScore,
                anomaly: anomaly,
                dataHash: dataHash,
                timestamp: uint64(block.timestamp)
            })
        );
        _latestIndexPlusOne[protocol] = signalId + 1;
        if (!_seenProtocol[protocol]) {
            _seenProtocol[protocol] = true;
            _protocols.push(protocol);
        }
        emit SignalRecorded(
            signalId, agentId, protocol, healthScore, riskScore, anomaly, dataHash, uint64(block.timestamp)
        );
    }

    function totalSignals() external view returns (uint256) {
        return _signals.length;
    }

    function getSignal(uint256 signalId) external view returns (Signal memory) {
        require(signalId < _signals.length, "out of range");
        return _signals[signalId];
    }

    function getLatestByProtocol(bytes32 protocol) external view returns (Signal memory signal, bool exists) {
        uint256 idxPlusOne = _latestIndexPlusOne[protocol];
        if (idxPlusOne == 0) return (signal, false);
        return (_signals[idxPlusOne - 1], true);
    }

    function getProtocols() external view returns (bytes32[] memory) {
        return _protocols;
    }

    /// @notice Returns the most recent `count` signals (oldest-first within the window).
    function getRecentSignals(uint256 count) external view returns (Signal[] memory out) {
        uint256 n = _signals.length;
        if (count > n) count = n;
        out = new Signal[](count);
        for (uint256 i = 0; i < count; i++) {
            out[i] = _signals[n - count + i];
        }
    }
}
