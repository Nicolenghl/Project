// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title GreenDish
 * @dev A restaurant-focused carbon credit marketplace with integrated token system
 */
contract GreenDish {
    // =============== STATE VARIABLES =============== //
    address public owner;
    uint public entryFee;
    uint public restaurantDeposit = 10 ether;
    uint public dishCounter;
    // Max purchases to track per customer
    uint constant MAX_PURCHASES_TRACKED = 100;
    mapping(uint => Dish) public dishes;
    mapping(address => uint[]) public restaurantDishes;
    mapping(address => uint) public restaurantDeposits;
    mapping(address => bool) public verifiedRestaurants;
    mapping(address => RestaurantInfo) public restaurantInfo;
    mapping(uint => DishRatingInfo) public dishRatings;
    mapping(uint => mapping(address => Rating)) public userRatings;
    // CustomerProfile struct and mapping is redundant with our new tracking system
    mapping(address => uint) public customerCarbonCredits;
    mapping(address => mapping(uint => Transaction)) public userTransactions;
    mapping(address => uint) public userTransactionCount;
    mapping(address => mapping(uint => bool)) public purchasedDishes;

    // Token Variables
    string public name = "GreenCoin";
    string public symbol = "GRC";
    uint8 public decimals = 18;
    uint256 public constant MAX_SUPPLY = 1000000 * 10 ** 18; // 1 million tokens with 18 decimals
    uint256 public totalSupply;
    mapping(address => uint256) public balances;
    mapping(address => mapping(address => uint256)) public allowances;

    // =============== STRUCTS =============== //
    enum SupplySource {
        LOCAL_PRODUCER,
        IMPORTED_PRODUCER,
        GREEN_PRODUCER,
        OTHER
    }

    struct RestaurantInfo {
        SupplySource supplySource;
        string supplyDetails;
        bool isRegistered;
    }

    struct Dish {
        string name;
        string mainComponent;
        uint carbonCredits;
        uint price;
        address restaurant;
        bool isActive;
        bool isVerified;
    }

    struct Rating {
        uint score; // 1-5 rating
        string comment;
        uint timestamp;
        bool rewarded;
    }

    struct DishRatingInfo {
        uint totalRatings;
        uint ratingSum;
        uint rewardedRatings;
    }

    struct CustomerProfile {
        uint totalCarbonCredits;
        uint transactionCount;
    }

    struct Transaction {
        uint dishId;
        uint timestamp;
        uint carbonCredits;
        uint price;
    }

    // =============== EVENTS =============== //
    event DishRegistered(
        uint indexed dishId,
        address indexed restaurant,
        string name
    );
    event DishPurchased(uint indexed dishId, address indexed customer);
    event RewardIssued(address indexed customer, uint amount);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
    event RestaurantRegistered(
        address indexed restaurant,
        SupplySource supplySource
    );
    event DishRated(uint indexed dishId, address indexed customer, uint score);
    event RatingRewarded(
        uint indexed dishId,
        address indexed customer,
        uint reward
    );
    event DishUpdated(
        uint indexed dishId,
        address indexed restaurant,
        bool isActive,
        SupplySource supplySource
    );

    // =============== CONSTRUCTOR =============== //
    constructor(uint _entryFee, uint _initialSupply) {
        owner = msg.sender;
        entryFee = _entryFee;

        // Mint initial token supply to the contract itself
        // Ensure initial supply doesn't exceed max supply
        require(_initialSupply <= 1000000, "Initial supply exceeds max supply");
        uint256 initialTokenSupply = _initialSupply * 10 ** uint256(decimals);
        totalSupply = initialTokenSupply;
        balances[address(this)] = initialTokenSupply;
        emit Transfer(address(0), address(this), initialTokenSupply);
    }

    // =============== MODIFIERS =============== //
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyDishOwner(uint _dishId) {
        require(dishes[_dishId].restaurant == msg.sender, "Not dish owner");
        _;
    }

    modifier onlyVerifiedRestaurant() {
        require(verifiedRestaurants[msg.sender], "Not verified");
        _;
    }

    modifier validDish(uint _dishId) {
        require(_dishId > 0 && _dishId <= dishCounter, "Invalid dish ID");
        _;
    }

    modifier hasPurchasedDish(uint _dishId) {
        require(
            purchasedDishes[msg.sender][_dishId],
            "Must purchase dish before rating"
        );
        _;
    }

    // =============== RESTAURANT FUNCTIONS =============== //
    function registerRestaurant(
        SupplySource _supplySource,
        string memory _supplyDetails
    ) external payable {
        require(!verifiedRestaurants[msg.sender], "Already verified");
        require(msg.value >= restaurantDeposit, "Low deposit");
        require(bytes(_supplyDetails).length > 0, "Supply details required");

        verifiedRestaurants[msg.sender] = true;
        restaurantDeposits[msg.sender] += msg.value;

        restaurantInfo[msg.sender] = RestaurantInfo({
            supplySource: _supplySource,
            supplyDetails: _supplyDetails,
            isRegistered: true
        });

        emit RestaurantRegistered(msg.sender, _supplySource);
    }

    function registerDish(
        string memory _name,
        string memory _mainComponent,
        uint _carbonCredits,
        uint _price
    ) external onlyVerifiedRestaurant {
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_mainComponent).length > 0, "Main component required");
        require(_price > 0, "Price must be greater than 0");
        require(_carbonCredits <= 100, "Invalid credits");

        dishCounter++;
        uint dishId = dishCounter;

        dishes[dishId] = Dish({
            name: _name,
            mainComponent: _mainComponent,
            carbonCredits: _carbonCredits,
            price: _price,
            restaurant: msg.sender,
            isActive: true,
            isVerified: true
        });

        restaurantDishes[msg.sender].push(dishId);

        // Initialize rating info for the dish
        dishRatings[dishId] = DishRatingInfo({
            totalRatings: 0,
            ratingSum: 0,
            rewardedRatings: 0
        });

        emit DishRegistered(dishId, msg.sender, _name);
    }

    function updateDish(
        uint _dishId,
        string memory _name,
        string memory _mainComponent,
        uint _carbonCredits,
        uint _price,
        bool _isActive,
        SupplySource _supplySource,
        string memory _supplyDetails
    ) external onlyDishOwner(_dishId) {
        require(_carbonCredits <= 100, "Invalid credits");
        require(bytes(_supplyDetails).length > 0, "Supply details required");
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_mainComponent).length > 0, "Main component required");
        require(_price > 0, "Price must be greater than 0");

        Dish storage dish = dishes[_dishId];
        dish.name = _name;
        dish.mainComponent = _mainComponent;
        dish.carbonCredits = _carbonCredits;
        dish.price = _price;
        dish.isActive = _isActive;

        // Update restaurant supply info
        restaurantInfo[msg.sender].supplySource = _supplySource;
        restaurantInfo[msg.sender].supplyDetails = _supplyDetails;

        // Emit event for dish update
        emit DishUpdated(_dishId, msg.sender, _isActive, _supplySource);
    }

    function getRestaurantInfo(
        address _restaurant
    ) external view returns (RestaurantInfo memory) {
        return restaurantInfo[_restaurant];
    }

    // =============== CUSTOMER FUNCTIONS =============== //
    function getDishes() external view returns (uint[] memory) {
        uint activeCount = 0;
        for (uint i = 1; i <= dishCounter; i++) {
            if (dishes[i].isActive) {
                activeCount++;
            }
        }

        uint[] memory activeDishes = new uint[](activeCount);
        uint index = 0;
        for (uint i = 1; i <= dishCounter; i++) {
            if (dishes[i].isActive) {
                activeDishes[index] = i;
                index++;
            }
        }

        return activeDishes;
    }

    function getDishDetails(
        uint _dishId
    ) external view validDish(_dishId) returns (Dish memory) {
        return dishes[_dishId];
    }

    function purchaseDishWithEth(
        uint _dishId
    ) external payable validDish(_dishId) {
        Dish storage dish = dishes[_dishId];
        require(dish.isActive, "Not active");
        require(dish.isVerified, "Not verified");
        require(msg.value >= dish.price, "Low payment");

        // Process purchase first (state changes)
        _processPurchase(_dishId, dish.price);

        // Transfer ETH after all state changes (prevents reentrancy)
        payable(dish.restaurant).transfer(dish.price);

        // Return excess payment
        if (msg.value > dish.price) {
            payable(msg.sender).transfer(msg.value - dish.price);
        }
    }

    function rateDish(
        uint _dishId,
        uint _score,
        string memory _comment
    ) external hasPurchasedDish(_dishId) validDish(_dishId) {
        require(_score >= 1 && _score <= 5, "Score must be 1-5");

        // Record the rating
        userRatings[_dishId][msg.sender] = Rating({
            score: _score,
            comment: _comment,
            timestamp: block.timestamp,
            rewarded: false
        });

        // Update dish rating stats
        DishRatingInfo storage ratings = dishRatings[_dishId];
        ratings.totalRatings++;
        ratings.ratingSum += _score;

        emit DishRated(_dishId, msg.sender, _score);

        // Reward user with half of what they received in their purchase
        _rewardForRating(_dishId, msg.sender);
    }

    function _rewardForRating(uint _dishId, address _rater) internal {
        // Only reward if not already rewarded
        Rating storage userRating = userRatings[_dishId][_rater];
        if (userRating.rewarded) return;

        // Find the user's transaction for this dish to calculate the reward
        Transaction memory userTx;
        bool foundTx = false;
        uint txCount = userTransactionCount[_rater];

        for (uint i = 0; i < txCount; i++) {
            if (userTransactions[_rater][i].dishId == _dishId) {
                userTx = userTransactions[_rater][i];
                foundTx = true;
                break;
            }
        }

        if (!foundTx) return;

        // Calculate reward as half of what they received for purchase
        uint carbonCredits = userTx.carbonCredits;
        uint purchaseReward = (carbonCredits * 10 ** uint256(decimals)) / 10; // 0.1 tokens per credit
        uint ratingReward = purchaseReward / 2; // Half of the purchase reward

        // Check available balance and total supply before issuing rewards
        if (ratingReward > 0 && balances[address(this)] >= ratingReward) {
            _transfer(address(this), _rater, ratingReward);
            userRating.rewarded = true;

            // Update stats
            DishRatingInfo storage ratings = dishRatings[_dishId];
            ratings.rewardedRatings++;

            emit RatingRewarded(_dishId, _rater, ratingReward);
        }
    }

    function _processPurchase(uint _dishId, uint _price) internal {
        Dish storage dish = dishes[_dishId];

        // Create transaction record
        uint txIndex = userTransactionCount[msg.sender];
        userTransactions[msg.sender][txIndex] = Transaction({
            dishId: _dishId,
            timestamp: block.timestamp,
            carbonCredits: dish.carbonCredits,
            price: _price
        });

        // Increment transaction count
        userTransactionCount[msg.sender]++;

        // Update carbon credits
        customerCarbonCredits[msg.sender] += dish.carbonCredits;

        // Also track which dishes were purchased for rating eligibility
        purchasedDishes[msg.sender][_dishId] = true;

        // Award tokens
        uint tokenReward = (dish.carbonCredits * 10 ** uint256(decimals)) / 10;
        if (tokenReward > 0 && balances[address(this)] >= tokenReward) {
            _transfer(address(this), msg.sender, tokenReward);
            emit RewardIssued(msg.sender, tokenReward);
        }

        emit DishPurchased(_dishId, msg.sender);
    }

    function getCustomerProfile()
        external
        view
        returns (CustomerProfile memory)
    {
        return
            CustomerProfile({
                totalCarbonCredits: customerCarbonCredits[msg.sender],
                transactionCount: userTransactionCount[msg.sender]
            });
    }

    function getUserTransactions(
        uint startIndex,
        uint count
    ) external view returns (Transaction[] memory) {
        uint availableCount = userTransactionCount[msg.sender];

        // Ensure we don't read past the end
        if (startIndex >= availableCount) {
            return new Transaction[](0);
        }

        // Determine how many records to return
        uint returnCount = count;
        if (startIndex + returnCount > availableCount) {
            returnCount = availableCount - startIndex;
        }

        // Create and fill result array
        Transaction[] memory result = new Transaction[](returnCount);
        for (uint i = 0; i < returnCount; i++) {
            result[i] = userTransactions[msg.sender][startIndex + i];
        }

        return result;
    }

    function getCustomerCarbonCredits() external view returns (uint) {
        return customerCarbonCredits[msg.sender];
    }

    function getCustomerTokenBalance() external view returns (uint) {
        return balances[msg.sender];
    }

    function getDishRating(
        uint _dishId
    ) external view validDish(_dishId) returns (uint, uint) {
        DishRatingInfo storage ratings = dishRatings[_dishId];
        if (ratings.totalRatings == 0) {
            return (0, 0);
        }
        return (ratings.ratingSum / ratings.totalRatings, ratings.totalRatings);
    }

    function getUserRating(
        uint _dishId,
        address _user
    ) external view returns (Rating memory) {
        return userRatings[_dishId][_user];
    }

    // =============== ADMIN FUNCTIONS =============== //
    function setEntryFee(uint _entryFee) external onlyOwner {
        if (_entryFee > 0) entryFee = _entryFee;
    }

    function withdrawEth(uint _amount) external onlyOwner {
        require(address(this).balance >= _amount, "Low balance");
        payable(owner).transfer(_amount);
    }

    // =============== HELPER FUNCTIONS =============== //
    function _transfer(
        address sender,
        address recipient,
        uint256 amount
    ) internal {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");
        require(
            balances[sender] >= amount,
            "ERC20: transfer amount exceeds balance"
        );

        balances[sender] -= amount;
        balances[recipient] += amount;
        emit Transfer(sender, recipient, amount);
    }

    // =============== TOKEN FUNCTIONS =============== //
    function transfer(
        address recipient,
        uint256 amount
    ) external returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        require(spender != address(0), "ERC20: approve to the zero address");
        allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool) {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(
            allowances[sender][msg.sender] >= amount,
            "ERC20: transfer amount exceeds allowance"
        );

        allowances[sender][msg.sender] -= amount;
        _transfer(sender, recipient, amount);
        return true;
    }

    receive() external payable {}

    fallback() external payable {}
}
