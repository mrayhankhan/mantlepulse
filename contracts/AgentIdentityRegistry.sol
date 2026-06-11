// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title AgentIdentityRegistry
/// @notice ERC-8004-inspired on-chain identity for autonomous agents. Each agent
///         is issued a unique identity NFT (the "AgentID") that binds an operator
///         address to an agent domain, establishing a verifiable on-chain record
///         of the agent within the Mantle ecosystem.
/// @dev    Implements the core ideas of ERC-8004's Identity Registry
///         (newAgent / getAgent / resolveByAddress) while exposing the AgentID as
///         an ERC-721 so the identity is visible in wallets and explorers.
contract AgentIdentityRegistry is ERC721 {
    struct AgentInfo {
        uint256 agentId;
        string agentDomain; // agent card URI / domain, e.g. "mantlepulse.xyz"
        address agentAddress; // operator/signing address that acts on-chain
        address owner; // controller of the identity
        uint64 registeredAt;
    }

    uint256 private _nextId = 1;
    mapping(uint256 => AgentInfo) private _agents;
    mapping(address => uint256) private _idByAddress; // operator address -> agentId

    event AgentRegistered(
        uint256 indexed agentId, address indexed agentAddress, address indexed owner, string agentDomain
    );
    event AgentUpdated(uint256 indexed agentId, address agentAddress, string agentDomain);

    constructor() ERC721("Mantle Agent Identity", "AGENT-ID") {}

    /// @notice Register a new agent identity and mint its AgentID NFT.
    function registerAgent(string calldata agentDomain, address agentAddress) public returns (uint256) {
        return _register(agentDomain, agentAddress);
    }

    /// @notice ERC-8004-style alias for {registerAgent}.
    function newAgent(string calldata agentDomain, address agentAddress) external returns (uint256) {
        return _register(agentDomain, agentAddress);
    }

    function _register(string calldata agentDomain, address agentAddress) internal returns (uint256 agentId) {
        require(agentAddress != address(0), "agentAddress=0");
        require(_idByAddress[agentAddress] == 0, "address already registered");

        agentId = _nextId++;
        _agents[agentId] = AgentInfo({
            agentId: agentId,
            agentDomain: agentDomain,
            agentAddress: agentAddress,
            owner: msg.sender,
            registeredAt: uint64(block.timestamp)
        });
        _idByAddress[agentAddress] = agentId;
        _safeMint(msg.sender, agentId);
        emit AgentRegistered(agentId, agentAddress, msg.sender, agentDomain);
    }

    /// @notice Update an agent's domain and/or operator address. Owner only.
    function updateAgent(uint256 agentId, string calldata agentDomain, address agentAddress) external {
        require(ownerOf(agentId) == msg.sender, "not owner");
        AgentInfo storage a = _agents[agentId];

        if (agentAddress != address(0) && agentAddress != a.agentAddress) {
            require(_idByAddress[agentAddress] == 0, "address already registered");
            _idByAddress[a.agentAddress] = 0;
            _idByAddress[agentAddress] = agentId;
            a.agentAddress = agentAddress;
        }
        if (bytes(agentDomain).length > 0) {
            a.agentDomain = agentDomain;
        }
        emit AgentUpdated(agentId, a.agentAddress, a.agentDomain);
    }

    function getAgent(uint256 agentId) external view returns (AgentInfo memory) {
        return _agents[agentId];
    }

    function resolveByAddress(address operator) external view returns (uint256) {
        return _idByAddress[operator];
    }

    function agentAddressOf(uint256 agentId) external view returns (address) {
        return _agents[agentId].agentAddress;
    }

    function totalAgents() external view returns (uint256) {
        return _nextId - 1;
    }
}
