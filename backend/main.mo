import OrderedMap "mo:base/OrderedMap";
import Text "mo:base/Text";
import Float "mo:base/Float";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Time "mo:base/Time";
import Int "mo:base/Int";

import Debug "mo:base/Debug";
import Principal "mo:base/Principal";

import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import AccessControl "authorization/access-control";

actor {
  // Authentication and User Management
  var accessControlState = AccessControl.initState();

  // Initialize auth (first caller becomes admin, others become users)
  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    // Admin-only check happens inside
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  public type UserProfile = {
    id : Text;
    name : Text;
    accountManagerId : Text;
    email : Text;
    phone : Text;
  };

  var userProfiles = OrderedMap.Make<Text>(Text.compare).empty<UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can save profiles");
    };
    OrderedMap.Make<Text>(Text.compare).get(userProfiles, Principal.toText(caller));
  };

  public query ({ caller }) func getUserProfile(id : Text) : async ?UserProfile {
    let currentUserProfile = OrderedMap.Make<Text>(Text.compare).get(userProfiles, Principal.toText(caller));
    switch (currentUserProfile) {
      case (?profile) if (id != profile.id) {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
          Debug.trap("Unauthorized: Can only view your own profile");
        };
      };
      case (_) {};
    };
    OrderedMap.Make<Text>(Text.compare).get(userProfiles, id);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles := OrderedMap.Make<Text>(Text.compare).put(userProfiles, Principal.toText(caller), profile);
  };

  // External Blob Storage Integration
  let storage = Storage.new();
  include MixinStorage(storage);

  // Rate Card Types
  public type RateCardItem = {
    id : Text;
    itemRefNo : Text;
    category : Text;
    subcategory : Text;
    detailedDescription : Text;
    opsBriskCost : Float;
    standardCost : Float;
  };

  public type RateCard = {
    items : [RateCardItem];
  };

  // Using ExternalBlob directly from Storage
  public type ExternalBlob = Storage.ExternalBlob;

  // Rate Card Storage
  transient let textMap = OrderedMap.Make<Text>(Text.compare);
  var rateCardItems = textMap.empty<RateCardItem>();

  // Update Rate Card
  public shared ({ caller }) func updateRateCard(newItems : [RateCardItem]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can perform this action");
    };
    rateCardItems := textMap.empty<RateCardItem>();
    for (item in newItems.vals()) {
      rateCardItems := textMap.put(rateCardItems, item.id, item);
    };
  };

  // Get Rate Card
  public query ({ caller }) func getRateCard() : async RateCard {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can perform this action");
    };
    let items = Iter.toArray(textMap.vals(rateCardItems));
    { items };
  };

  // Get Single Rate Card Item
  public query ({ caller }) func getRateCardItem(id : Text) : async ?RateCardItem {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can perform this action");
    };
    textMap.get(rateCardItems, id);
  };

  // Quote and Analysis Types
  public type QuoteItem = {
    id : Text;
    itemRefNo : Text;
    category : Text;
    subcategory : Text;
    detailedDescription : Text;
    opsBriskCost : Float;
    standardCost : Float;
    quantity : Nat;
    duration : Nat;
    total : Float;
  };

  public type Quote = {
    items : [QuoteItem];
    total : Float;
  };

  public type QuoteHeader = {
    clientName : Text;
    projectDuration : Text;
    accountManager : Text;
    projectName : Text;
  };

  public type FullQuote = {
    header : QuoteHeader;
    items : [QuoteItem];
    total : Float;
  };

  public type QuoteHistoryItem = {
    id : Text;
    timestamp : Int;
    header : QuoteHeader;
    items : [QuoteItem];
    total : Float;
  };

  // Quote History Storage
  var quoteHistory = textMap.empty<QuoteHistoryItem>();

  // Generate Quote
  public shared ({ caller }) func generateQuote(selectedItems : [(Text, Nat, Nat)]) : async Quote {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can perform this action");
    };
    var quoteItems : [QuoteItem] = [];
    var total : Float = 0.0;

    for ((itemId, quantity, duration) in selectedItems.vals()) {
      switch (textMap.get(rateCardItems, itemId)) {
        case (null) {};
        case (?item) {
          let itemTotal = item.standardCost * Float.fromInt(quantity) * Float.fromInt(duration);
          let quoteItem : QuoteItem = {
            id = item.id;
            itemRefNo = item.itemRefNo;
            category = item.category;
            subcategory = item.subcategory;
            detailedDescription = item.detailedDescription;
            opsBriskCost = item.opsBriskCost;
            standardCost = item.standardCost;
            quantity;
            duration;
            total = itemTotal;
          };
          quoteItems := Array.append(quoteItems, [quoteItem]);
          total += itemTotal;
        };
      };
    };

    {
      items = quoteItems;
      total;
    };
  };

  // Generate Full Quote
  public shared ({ caller }) func generateFullQuote(header : QuoteHeader, selectedItems : [(Text, Nat, Nat)]) : async FullQuote {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can perform this action");
    };
    var quoteItems : [QuoteItem] = [];
    var total : Float = 0.0;

    for ((itemId, quantity, duration) in selectedItems.vals()) {
      switch (textMap.get(rateCardItems, itemId)) {
        case (null) {};
        case (?item) {
          let itemTotal = item.standardCost * Float.fromInt(quantity) * Float.fromInt(duration);
          let quoteItem : QuoteItem = {
            id = item.id;
            itemRefNo = item.itemRefNo;
            category = item.category;
            subcategory = item.subcategory;
            detailedDescription = item.detailedDescription;
            opsBriskCost = item.opsBriskCost;
            standardCost = item.standardCost;
            quantity;
            duration;
            total = itemTotal;
          };
          quoteItems := Array.append(quoteItems, [quoteItem]);
          total += itemTotal;
        };
      };
    };

    let quoteId = Int.toText(Time.now());
    let timestamp = Time.now();

    let historyItem : QuoteHistoryItem = {
      id = quoteId;
      timestamp;
      header;
      items = quoteItems;
      total;
    };

    quoteHistory := textMap.put(quoteHistory, quoteId, historyItem);

    {
      header;
      items = quoteItems;
      total;
    };
  };

  // Get All Rate Card Items
  public query ({ caller }) func getAllRateCardItems() : async [RateCardItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can perform this action");
    };
    Iter.toArray(textMap.vals(rateCardItems));
  };

  // Add Single Rate Card Item
  public shared ({ caller }) func addRateCardItem(item : RateCardItem) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can perform this action");
    };
    rateCardItems := textMap.put(rateCardItems, item.id, item);
  };

  // Delete Rate Card Item
  public shared ({ caller }) func deleteRateCardItem(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can perform this action");
    };
    rateCardItems := textMap.delete(rateCardItems, id);
  };

  // Update Single Rate Card Item
  public shared ({ caller }) func updateRateCardItem(item : RateCardItem) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can perform this action");
    };
    rateCardItems := textMap.put(rateCardItems, item.id, item);
  };

  // Analysis Types and Functions
  public type AnalysisItem = {
    id : Text;
    itemRefNo : Text;
    category : Text;
    subcategory : Text;
    detailedDescription : Text;
    opsBriskCost : Float;
    standardCost : Float;
    quantity : Nat;
    duration : Nat;
    total : Float;
    margin : Float;
    marginPercentage : Float;
  };

  public type AnalysisSummary = {
    items : [AnalysisItem];
    totalMargin : Float;
    totalProfit : Float;
  };

  // Generate Analysis
  public shared ({ caller }) func generateAnalysis(selectedItems : [(Text, Nat, Nat)]) : async AnalysisSummary {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can perform this action");
    };
    var analysisItems : [AnalysisItem] = [];
    var totalMargin : Float = 0.0;
    var totalProfit : Float = 0.0;

    for ((itemId, quantity, duration) in selectedItems.vals()) {
      switch (textMap.get(rateCardItems, itemId)) {
        case (null) {};
        case (?item) {
          let total = item.standardCost * Float.fromInt(quantity) * Float.fromInt(duration);
          let margin = item.standardCost - item.opsBriskCost;
          let marginPercentage = if (item.standardCost > 0.0) {
            (margin / item.standardCost) * 100.0;
          } else { 0.0 };
          let analysisItem : AnalysisItem = {
            id = item.id;
            itemRefNo = item.itemRefNo;
            category = item.category;
            subcategory = item.subcategory;
            detailedDescription = item.detailedDescription;
            opsBriskCost = item.opsBriskCost;
            standardCost = item.standardCost;
            quantity;
            duration;
            total;
            margin;
            marginPercentage;
          };
          analysisItems := Array.append(analysisItems, [analysisItem]);
          totalMargin += margin;
          totalProfit += total;
        };
      };
    };

    {
      items = analysisItems;
      totalMargin;
      totalProfit;
    };
  };

  // Get Quote History
  public query ({ caller }) func getQuoteHistory() : async [QuoteHistoryItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can perform this action");
    };
    Iter.toArray(textMap.vals(quoteHistory));
  };

  // Get Single Quote History Item
  public query ({ caller }) func getQuoteHistoryItem(id : Text) : async ?QuoteHistoryItem {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can perform this action");
    };
    textMap.get(quoteHistory, id);
  };

  // Update Standard Cost
  public shared ({ caller }) func updateStandardCost(itemId : Text, newStandardCost : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can perform this action");
    };
    switch (textMap.get(rateCardItems, itemId)) {
      case (null) {};
      case (?item) {
        let updatedItem : RateCardItem = {
          item with standardCost = newStandardCost;
        };
        rateCardItems := textMap.put(rateCardItems, itemId, updatedItem);
      };
    };
  };

  // Account Manager and Resource Management Types
  public type AccountManager = {
    id : Text;
    name : Text;
    email : ?Text;
  };

  public type AccountManagerList = {
    managers : [AccountManager];
  };

  // Account Manager Storage
  var accountManagers = textMap.empty<AccountManager>();

  // Update Account Managers
  public shared ({ caller }) func updateAccountManagers(newManagers : [AccountManager]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can perform this action");
    };
    accountManagers := textMap.empty<AccountManager>();
    for (manager in newManagers.vals()) {
      accountManagers := textMap.put(accountManagers, manager.id, manager);
    };
  };

  // Get All Account Managers
  public query ({ caller }) func getAccountManagers() : async AccountManagerList {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can perform this action");
    };
    let managers = Iter.toArray(textMap.vals(accountManagers));
    { managers };
  };

  // Add Single Account Manager
  public shared ({ caller }) func addAccountManager(manager : AccountManager) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can perform this action");
    };
    accountManagers := textMap.put(accountManagers, manager.id, manager);
  };

  // Delete Account Manager
  public shared ({ caller }) func deleteAccountManager(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can perform this action");
    };
    accountManagers := textMap.delete(accountManagers, id);
  };

  // Update Single Account Manager
  public shared ({ caller }) func updateAccountManager(manager : AccountManager) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can perform this action");
    };
    accountManagers := textMap.put(accountManagers, manager.id, manager);
  };

  // File Upload Tracking
  public type UploadedFile = {
    id : Text;
    name : Text;
    size : Nat;
    contentType : Text;
    blobId : Text;
  };

  var uploadedFiles = textMap.empty<UploadedFile>();

  // Track Uploaded File
  public shared ({ caller }) func trackUploadedFile(file : UploadedFile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can perform this action");
    };
    uploadedFiles := textMap.put(uploadedFiles, file.id, file);
  };

  // Get All Uploaded Files
  public query ({ caller }) func getUploadedFiles() : async [UploadedFile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can perform this action");
    };
    Iter.toArray(textMap.vals(uploadedFiles));
  };
};
