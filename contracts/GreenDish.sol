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
    uint public dishCounter;
    bool private _locked;

    // Max purchases to track per customer
    mapping(uint => Dish) public dishes;
    mapping(address => uint[]) public restaurantDishes;
    mapping(address => bool) public verifiedRestaurants;
    mapping(address => RestaurantInfo) public restaurantInfo;
    mapping(uint => DishRatingInfo) public dishRatings;
    // Store ratings per transaction instead of per dish/user
    mapping(address => mapping(uint => Rating)) public transactionRatings; // user -> transactionIndex -> Rating
    mapping(address => uint) public customerCarbonCredits;
    mapping(address => mapping(uint => Transaction)) public userTransactions;
    mapping(address => uint) public userTransactionCount;

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
        bool rated;
        bool ratingRewarded;
        bool purchaseRewarded;
    }

    // =============== EVENTS =============== //
    event DishRegistered(
        uint indexed dishId,
        address indexed restaurant,
        string name
    );
    event DishPurchased(uint indexed dishId, address indexed customer);
    event PurchaseRewarded(
        uint indexed dishId,
        address indexed customer,
        uint reward
    );
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
        uint price
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

    modifier nonReentrant() {
        require(!_locked, "ReentrancyGuard: reentrant call");
        _locked = true;
        _;
        _locked = false;
    }

    // =============== RESTAURANT FUNCTIONS =============== //
    function registerRestaurant(
        SupplySource _supplySource,
        string memory _supplyDetails
    ) external payable {
        require(
            !verifiedRestaurants[msg.sender],
            "Restaurant already registered"
        );
        require(msg.value >= entryFee, "Insufficient registration fee");
        require(bytes(_supplyDetails).length > 0, "Supply details required");
        verifiedRestaurants[msg.sender] = true;
        restaurantInfo[msg.sender] = RestaurantInfo({
            supplySource: _supplySource,
            supplyDetails: _supplyDetails
        });

        emit RestaurantRegistered(msg.sender, _supplySource);
    }

    function registerDish(
        string memory _name,
        string memory _mainComponent,
        uint _carbonCredits,
        uint _price
    ) external onlyVerifiedRestaurant nonReentrant {
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_mainComponent).length > 0, "Main component required");
        require(_price > 0, "Price must be greater than 0");
        require(_carbonCredits > 0 && _carbonCredits <= 100, "Invalid credits");

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
        uint _price,
        bool _isActive
    ) external onlyDishOwner(_dishId) {
        Dish storage dish = dishes[_dishId];
        dish.price = _price;
        dish.isActive = _isActive;

        emit DishUpdated(_dishId, msg.sender, _isActive, _price);
    }

    function getRestaurantInfo(
        address _restaurant
    ) external view returns (RestaurantInfo memory) {
        return restaurantInfo[_restaurant];
    }

    // =============== CUSTOMER FUNCTIONS =============== //

    function getDishes(
        uint startIndex,
        uint count
    ) external view returns (uint[] memory) {
        // Ensure we don't read past the end
        uint endIndex = (startIndex + count > dishCounter)
            ? dishCounter
            : startIndex + count;

        // First determine how many active dishes in the requested range
        uint activeCount = 0;
        for (uint i = startIndex; i <= endIndex; i++) {
            if (i > 0 && dishes[i].isActive) {
                activeCount++;
            }
        }

        // Create result array of the right size
        uint[] memory result = new uint[](activeCount);

        // Fill array with active dish IDs
        uint resultIndex = 0;
        for (uint i = startIndex; i <= endIndex; i++) {
            if (i > 0 && dishes[i].isActive) {
                result[resultIndex] = i;
                resultIndex++;
            }
        }

        return result;
    }

    function getDishDetails(
        uint _dishId
    ) external view validDish(_dishId) returns (Dish memory) {
        return dishes[_dishId];
    }

    function purchaseDish(
        uint _dishId
    ) external payable nonReentrant validDish(_dishId) {
        Dish storage dish = dishes[_dishId];
        require(dish.isActive, "This dish is not currently available");
        require(dish.isVerified, "This dish is not verified");
        require(msg.value == dish.price, "Wrong payment amount");

        require(
            msg.sender != dish.restaurant,
            "Restaurant cannot purchase own dish"
        );

        address restaurantAddress = dish.restaurant;
        payable(restaurantAddress).transfer(msg.value);

        // Then do all state modifications
        uint carbonCredits = dish.carbonCredits;
        uint purchaseReward = (carbonCredits * 10 ** uint256(decimals)) / 10;
        bool canReward = (purchaseReward > 0 &&
            balances[address(this)] >= purchaseReward);

        // Process state changes
        uint txIndex = userTransactionCount[msg.sender];

        // Create the transaction record with the appropriate initial reward status
        userTransactions[msg.sender][txIndex] = Transaction({
            dishId: _dishId,
            timestamp: block.timestamp,
            carbonCredits: carbonCredits,
            price: dish.price,
            rated: false,
            ratingRewarded: false,
            purchaseRewarded: false // Initially set to false, will update if reward is processed
        });

        userTransactionCount[msg.sender]++;

        // Update customer carbon credits
        customerCarbonCredits[msg.sender] += carbonCredits;

        // First the purchase event
        emit DishPurchased(_dishId, msg.sender);

        // Then if applicable, the reward event
        if (canReward) {
            _transfer(address(this), msg.sender, purchaseReward);
            userTransactions[msg.sender][txIndex].purchaseRewarded = true;
            emit PurchaseRewarded(_dishId, msg.sender, purchaseReward);
        }
    }

    function rateDish(
        uint _dishId,
        uint _score,
        string memory _comment,
        uint _transactionIndex
    ) external validDish(_dishId) {
        require(_score >= 1 && _score <= 5, "Score must be 1-5");
        require(
            _transactionIndex < userTransactionCount[msg.sender],
            "Invalid transaction index"
        );
        require(bytes(_comment).length <= 200, "Comment too long");

        Transaction storage userTx = userTransactions[msg.sender][
            _transactionIndex
        ];

        require(userTx.dishId == _dishId, "Transaction not for this dish");
        require(!userTx.rated, "Transaction already rated");

        transactionRatings[msg.sender][_transactionIndex] = Rating({
            score: _score,
            comment: _comment,
            timestamp: block.timestamp
        });

        // Update dish rating stats
        DishRatingInfo storage ratings = dishRatings[_dishId];
        ratings.totalRatings++;
        ratings.ratingSum += _score;

        // Mark the transaction as rated
        userTx.rated = true;

        emit DishRated(_dishId, msg.sender, _score);

        // Process reward for the rating - pass userTx directly to avoid loading it again
        _processRatingReward(_dishId, msg.sender, userTx);
    }

    function _processRatingReward(
        uint _dishId,
        address _rater,
        Transaction storage userTx
    ) internal {
        // Only reward if rating hasn't been rewarded yet
        require(!userTx.ratingRewarded, "Rating already rewarded");

        uint _carbonCredits = userTx.carbonCredits;

        // Calculate rating reward - 5% of carbon credits (0.05 tokens per credit)
        uint ratingReward = (_carbonCredits * 10 ** uint256(decimals)) / 20; // 0.05 tokens per credit

        // Check contract has sufficient balance
        require(
            ratingReward > 0 && balances[address(this)] >= ratingReward,
            "Insufficient reward funds"
        );

        // Process the reward
        _transfer(address(this), _rater, ratingReward);

        // Mark this transaction's rating as rewarded
        userTx.ratingRewarded = true;

        // Update reward stats
        DishRatingInfo storage ratings = dishRatings[_dishId];
        ratings.rewardedRatings++;

        // Emit the rating reward event
        emit RatingRewarded(_dishId, _rater, ratingReward);
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
    ) external view validDish(_dishId) returns (uint, uint, uint) {
        DishRatingInfo storage ratings = dishRatings[_dishId];
        if (ratings.totalRatings == 0) {
            return (0, 0, 0); // Return (whole number part, total ratings, rating with 1 decimal)
        }

        // Calculate average with one decimal place (multiply by 10 first, then divide)
        uint ratingWithDecimal = (ratings.ratingSum * 10) /
            ratings.totalRatings;

        // Extract the whole number part (integer division)
        uint wholeNumber = ratingWithDecimal / 10;

        return (wholeNumber, ratings.totalRatings, ratingWithDecimal);
    }

    function getUserDishRatings(
        address _user,
        uint _dishId
    )
        external
        view
        validDish(_dishId)
        returns (uint[] memory transactionIndices, Rating[] memory ratings)
    {
        uint txCount = userTransactionCount[_user];

        // First count the number of rated transactions for this dish
        uint ratedCount = 0;
        for (uint i = 0; i < txCount; i++) {
            Transaction memory userTx = userTransactions[_user][i];
            if (userTx.dishId == _dishId && userTx.rated) {
                ratedCount++;
            }
        }

        // Create arrays of the right size
        transactionIndices = new uint[](ratedCount);
        ratings = new Rating[](ratedCount);

        // Fill the arrays
        if (ratedCount > 0) {
            uint resultIndex = 0;
            for (uint i = 0; i < txCount; i++) {
                Transaction memory userTx = userTransactions[_user][i];
                if (userTx.dishId == _dishId && userTx.rated) {
                    transactionIndices[resultIndex] = i;
                    ratings[resultIndex] = transactionRatings[_user][i];
                    resultIndex++;
                }
            }
        }

        return (transactionIndices, ratings);
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
