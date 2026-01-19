import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  View,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
  BackHandler,
  Pressable,
  Text,
  TouchableOpacity,
  Image,
} from "react-native";
import {
  CarouselPagination,
  ListHeader,
  Header,
} from "@components/Home";
import { ListItem } from '@components/Options';
import BottomSheet, { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { fetchCategoriesOdoo } from "@api/services/generalApi";
import { RoundedContainer, SafeAreaView } from "@components/containers";
import { COLORS, FONT_FAMILY } from "@constants/theme";
import { showToastMessage } from "@components/Toast";
import { useDataFetching, useLoader } from "@hooks";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { useAuthStore } from '@stores/auth';
import { OverlayLoader } from "@components/Loader";

const { height } = Dimensions.get("window");

// Category Item Component
const CategoryItem = ({ item, onPress }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const categoryIcon = require('@assets/icons/bottom_tabs/category.png');
  
  const displayName = item?.name || item?.category_name || 'Category';
  const truncatedName = displayName.length > 12 
    ? displayName.substring(0, 11) + '...' 
    : displayName;

  // Check if we have a valid image URL (not false, null, or empty)
  const hasValidImage = item?.image_url && 
    item.image_url !== false && 
    item.image_url !== 'false' &&
    !item.image_url.includes('undefined') &&
    !imageError;

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  return (
    <TouchableOpacity onPress={onPress} style={styles.categoryItem}>
      {imageLoading && hasValidImage && (
        <ActivityIndicator 
          size="small" 
          color={COLORS.primaryThemeColor} 
          style={styles.imageLoader} 
        />
      )}
      <View style={styles.imageContainer}>
        {hasValidImage ? (
          <Image
            source={{ uri: item.image_url }}
            style={styles.categoryImage}
            onLoad={() => setImageLoading(false)}
            onError={handleImageError}
            resizeMode="contain"
          />
        ) : (
          <Image
            source={categoryIcon}
            style={[styles.categoryImage, styles.categoryIconFallback]}
            resizeMode="contain"
          />
        )}
      </View>
      <Text style={styles.categoryName} numberOfLines={2}>{truncatedName}</Text>
    </TouchableOpacity>
  );
};

// Format data for grid display
const formatData = (data, numColumns) => {
  if (!data || !Array.isArray(data)) return [];
  const clonedData = [...data];
  const numberOfFullRows = Math.floor(clonedData.length / numColumns);
  let numberOfElementsLastRow = clonedData.length - numberOfFullRows * numColumns;
  while (numberOfElementsLastRow !== numColumns && numberOfElementsLastRow !== 0) {
    clonedData.push({ id: `blank-${numberOfElementsLastRow}`, empty: true });
    numberOfElementsLastRow++;
  }
  return clonedData;
};

const HomeScreen = ({ navigation }) => {
  const [backPressCount, setBackPressCount] = useState(0);
  const isFocused = useIsFocused();
  
  // Changed: Fetch Categories from Odoo instead of Products
  const { data, loading, fetchData, fetchMoreData } =
    useDataFetching(fetchCategoriesOdoo);

  const handleBackPress = useCallback(() => {
    if (navigation.isFocused()) {
      if (backPressCount === 0) {
        setBackPressCount(1);
        return true;
      } else if (backPressCount === 1) {
        BackHandler.exitApp();
      }
    }
    return false;
  }, [backPressCount, navigation]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress
    );
    return () => backHandler.remove();
  }, [handleBackPress]);

  useEffect(() => {
    const backPressTimer = setTimeout(() => {
      setBackPressCount(0);
    }, 2000);

    return () => clearTimeout(backPressTimer);
  }, [backPressCount]);

  useEffect(() => {
    if (backPressCount === 1) {
      showToastMessage("Press back again to exit");
    }
  }, [backPressCount]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  useEffect(() => {
    if (isFocused) {
      fetchData();
    }
  }, [isFocused]);

  useEffect(() => {
    if (data && Array.isArray(data)) {
      console.log('[Home] Fetched categories from Odoo (product.category):', data.length);
    }
  }, [data]);

  const handleLoadMore = () => {
    fetchMoreData();
  };

  const authUser = useAuthStore((s) => s.user);

  useEffect(() => {
    if (authUser) {
      const uid = authUser.uid || authUser.id || null;
      const uname = authUser.name || authUser.username || authUser.partner_display_name || null;
      console.log('[AUTH] current user id:', uid, 'name:', uname);
    } else {
      console.log('[AUTH] no authenticated user');
    }
  }, [authUser]);

  // Handle category press - navigate to Products screen filtered by category
  const handleCategoryPress = (category) => {
    console.log('[Home] Selected category:', category);
    navigation.navigate('Products', { 
      categoryId: category._id || category.id,
      categoryName: category.name || category.category_name 
    });
  };

  const renderItem = ({ item }) => {
    if (item.empty) {
      return <View style={[styles.categoryItem, styles.itemInvisible]} />;
    }
    return (
      <CategoryItem
        item={item}
        onPress={() => handleCategoryPress(item)}
      />
    );
  };

  const navigateToScreen = (screenName) => {
    navigation.navigate(screenName);
  };

  const snapPoints = useMemo(() => {
    if (height < 700) {
      return ["39%", "80%"];
    } else if (height < 800) {
      return ["41%", "82%"];
    } else if (height < 900) {
      return ["43%", "85%"];
    } else {
      return ["45%", "90%"];
    }
  }, [height]);

  const [detailLoading] = useLoader(false);

  return (
    <SafeAreaView backgroundColor={COLORS.primaryThemeColor}>
      <RoundedContainer>
        <Header />
        <View style={{ marginTop: -20, marginBottom: -8 }}>
          <CarouselPagination />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: 12, paddingHorizontal: 20 }}>
          <ListItem
            title="Sales Order"
            image={require('@assets/images/Home/section/service.png')}
            onPress={() => navigateToScreen('SalesOrderChoice')}
          />
          <ListItem
            title="POS"
            image={require('@assets/images/Home/section/possss.png')}
            onPress={() => navigateToScreen('POSRegister')}
          />
        </View>

        <BottomSheet snapPoints={snapPoints} style={{ marginTop: 12 }}>
          {/* Changed: Title from "Products" to "Categories" */}
          <ListHeader title="Categories" />
          <BottomSheetFlatList
            data={formatData(data, 3)}
            numColumns={3}
            initialNumToRender={9}
            renderItem={renderItem}
            keyExtractor={(item, index) => (item._id || item.id || index).toString()}
            contentContainerStyle={{ paddingBottom: '25%', paddingHorizontal: 8 }}
            onEndReached={handleLoadMore}
            showsVerticalScrollIndicator={false}
            onEndReachedThreshold={0.2}
            ListFooterComponent={loading && <ActivityIndicator size="large" color={COLORS.primaryThemeColor} />}
            ListEmptyComponent={
              !loading && (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No categories available</Text>
                </View>
              )
            }
          />
        </BottomSheet>
        
        <OverlayLoader visible={detailLoading} />

      </RoundedContainer>
      
      {/* Bottom Navigation - Three Buttons */}
      <View pointerEvents="box-none" style={styles.bottomNavigation}>
        {/* Home Button */}
        <Pressable
          onPress={() => navigateToScreen("Home")}
          style={({ pressed }) => [styles.navButton, styles.navButtonActive, pressed && styles.navPressed]}
        >
          <Text style={[styles.navLabel, styles.navLabelActive]}>Home</Text>
        </Pressable>

        {/* Category Button (Center) */}
        <Pressable
          onPress={() => navigateToScreen("Categories")}
          style={({ pressed }) => [styles.navButton, pressed && styles.navPressed]}
        >
          <Text style={styles.navLabel}>Category</Text>
        </Pressable>

        {/* Profile Button */}
        <Pressable
          onPress={() => navigateToScreen("Profile")}
          style={({ pressed }) => [styles.navButton, pressed && styles.navPressed]}
        >
          <Text style={styles.navLabel}>Profile</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  itemInvisible: {
    backgroundColor: "transparent",
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  
  // Category Item Styles
  categoryItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 6,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    minHeight: 110,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  imageLoader: {
    position: 'absolute',
    top: 25,
    zIndex: 1,
  },
  
  imageContainer: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  
  categoryImage: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    borderRadius: 8,
  },
  
  categoryIconFallback: {
    tintColor: COLORS.primaryThemeColor || '#1316c5',
    opacity: 0.7,
  },
  
  categoryName: {
    fontSize: 12,
    textAlign: 'center',
    color: COLORS.primaryThemeColor || '#1316c5',
    fontFamily: FONT_FAMILY?.urbanistBold || 'System',
    fontWeight: '700',
  },
  
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  
  // Bottom Navigation Styles
  bottomNavigation: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 9999,
  },

  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    minWidth: 90,
  },

  navButtonActive: {
    backgroundColor: COLORS.primaryThemeColor || "#4CAF50",
  },

  navPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.95,
  },

  navLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#333",
  },

  navLabelActive: {
    color: "#ffffff",
  },
});

export default HomeScreen;
