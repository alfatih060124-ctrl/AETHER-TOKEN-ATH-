// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title Aether Token (ATH)
 * @notice Fixed-supply BEP-20 token for the Aether ecosystem.
 * @dev Supply is minted once to initialOwner. No mint function exists after deployment.
 */
contract ATHToken is ERC20, ERC20Burnable, Ownable, Pausable {
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10 ** 18;

    constructor(address initialOwner)
        ERC20("Aether", "ATH")
        Ownable(initialOwner)
    {
        require(initialOwner != address(0), "Invalid owner");
        _mint(initialOwner, TOTAL_SUPPLY);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _update(address from, address to, uint256 value)
        internal
        override
        whenNotPaused
    {
        super._update(from, to, value);
    }
}
