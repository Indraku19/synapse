// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title  KnowledgeRegistry
 * @notice On-chain verification registry for Synapse knowledge objects.
 *         Deployed on the 0G Chain testnet.
 *
 * @dev    Stores {hash, agentId, knowledgeId, cid, timestamp} for each entry.
 *         Full knowledge objects live in 0G Storage (off-chain).
 *         This contract guarantees provenance, prevents tampering, and links
 *         the on-chain record to its 0G Storage location via the CID.
 */
contract KnowledgeRegistry {

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event KnowledgeStored(
        bytes32 indexed contentHash,
        string  indexed agentId,
        string          knowledgeId,
        string          cid,
        uint256         timestamp
    );

    // -------------------------------------------------------------------------
    // Data structures
    // -------------------------------------------------------------------------

    struct KnowledgeRecord {
        bytes32 contentHash;
        string  agentId;
        string  knowledgeId;
        string  cid;           // 0G Storage content identifier (root hash)
        uint256 timestamp;
        bool    exists;
    }

    // contentHash → record
    mapping(bytes32 => KnowledgeRecord) private _records;

    // Ordered list of all hashes (for enumeration / pagination)
    bytes32[] private _allHashes;

    // -------------------------------------------------------------------------
    // Write
    // -------------------------------------------------------------------------

    /**
     * @notice Store a knowledge verification record.
     *
     * @param contentHash  SHA-256 hash of the knowledge content (32 bytes).
     * @param agentId      Identifier of the agent that produced this knowledge.
     * @param knowledgeId  UUID of the knowledge entry (matches backend ID).
     * @param cid          0G Storage content identifier for the full object.
     *
     * Reverts if the same contentHash has already been registered
     * (knowledge entries are immutable once stored).
     */
    function storeKnowledgeHash(
        bytes32 contentHash,
        string  calldata agentId,
        string  calldata knowledgeId,
        string  calldata cid
    ) external {
        require(!_records[contentHash].exists,   "KnowledgeRegistry: already stored");
        require(bytes(agentId).length     > 0,   "KnowledgeRegistry: agentId empty");
        require(bytes(knowledgeId).length > 0,   "KnowledgeRegistry: knowledgeId empty");

        _records[contentHash] = KnowledgeRecord({
            contentHash: contentHash,
            agentId:     agentId,
            knowledgeId: knowledgeId,
            cid:         cid,
            timestamp:   block.timestamp,
            exists:      true
        });
        _allHashes.push(contentHash);

        emit KnowledgeStored(contentHash, agentId, knowledgeId, cid, block.timestamp);
    }

    // -------------------------------------------------------------------------
    // Read
    // -------------------------------------------------------------------------

    /**
     * @notice Verify that a content hash is on record.
     *
     * @return exists      Whether the hash has been registered.
     * @return agentId     The agent that stored it.
     * @return knowledgeId The backend UUID of this knowledge entry.
     * @return cid         The 0G Storage content identifier.
     * @return timestamp   Block timestamp at storage time (unix seconds).
     */
    function verify(bytes32 contentHash)
        external
        view
        returns (
            bool    exists,
            string memory agentId,
            string memory knowledgeId,
            string memory cid,
            uint256 timestamp
        )
    {
        KnowledgeRecord storage r = _records[contentHash];
        return (r.exists, r.agentId, r.knowledgeId, r.cid, r.timestamp);
    }

    /**
     * @notice Total number of registered knowledge entries.
     */
    function totalEntries() external view returns (uint256) {
        return _allHashes.length;
    }

    /**
     * @notice Return the content hash at a given index (for off-chain pagination).
     */
    function hashAt(uint256 index) external view returns (bytes32) {
        require(index < _allHashes.length, "KnowledgeRegistry: out of bounds");
        return _allHashes[index];
    }
}
