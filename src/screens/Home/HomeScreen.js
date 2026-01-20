import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  View,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
  BackHandler,
  Text,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  TextInput,
  Pressable,
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

// Search Bar Component
const SearchBar = ({ onPress, isTablet }) => {
  return (
    <Pressable onPress={onPress} style={[styles.searchContainer, isTablet && styles.searchContainerTablet]}>
      <View style={[styles.searchBar, isTablet && styles.searchBarTablet]}>
        <Text style={styles.searchIconText}>🔍</Text>
        <Text style={[styles.searchPlaceholder, isTablet && { fontSize: 16 }]}>
          What are you looking for?
        </Text>
      </View>
    </Pressable>
  );
};

// Category Item Component with responsive sizing
const CategoryItem = ({ item, onPress, isTablet }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const categoryIcon = require('@assets/icons/bottom_tabs/category.png');
  
  const displayName = item?.name || item?.category_name || 'Category';
  const maxLength = isTablet ? 16 : 12;
  const truncatedName = displayName.length > maxLength 
    ? displayName.substring(0, maxLength - 1) + '...' 
    : displayName;

  const hasValidImage = item?.image_url && 
    item.image_url !== false && 
    item.image_url !== 'false' &&
    !item.image_url.includes('undefined') &&
    !imageError;

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  // Responsive sizes
  const imageSize = isTablet ? 70 : 50;
  const itemMinHeight = isTablet ? 140 : 110;
  const fontSize = isTablet ? 14 : 12;

  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={[
        styles.categoryItem, 
        { minHeight: itemMinHeight, margin: isTablet ? 10 : 6, padding: isTablet ? 16 : 12 }
      ]}
    >
      {imageLoading && hasValidImage && (
        <ActivityIndicator 
          size="small" 
          color={COLORS.primaryThemeColor} 
          style={styles.imageLoader} 
        />
      )}
      <View style={[styles.imageContainer, { width: imageSize, height: imageSize }]}>
        {hasValidImage ? (
          <Image
            source={{ uri: item.image_url }}
            style={[styles.categoryImage, { width: imageSize, height: imageSize }]}
            onLoad={() => setImageLoading(false)}
            onError={handleImageError}
            resizeMode="contain"
          />
        ) : (
          <Image
            source={categoryIcon}
            style={[styles.categoryImage, styles.categoryIconFallback, { width: imageSize, height: imageSize }]}
            resizeMode="contain"
          />
        )}
      </View>
      <Text style={[styles.categoryName, { fontSize }]} numberOfLines={2}>{truncatedName}</Text>
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
  
  // Get responsive dimensions
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 600;
  const numColumns = isTablet ? 4 : 3;
  
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

  const handleCategoryPress = (category) => {
    console.log('[Home] Selected category:', category);
    navigation.navigate('Products', { 
      categoryId: category._id || category.id,
      categoryName: category.name || category.category_name 
    });
  };

  const renderItem = ({ item }) => {
    if (item.empty) {
      return <View style={[styles.categoryItem, styles.itemInvisible, { margin: isTablet ? 10 : 6 }]} />;
    }
    return (
      <CategoryItem
        item={item}
        onPress={() => handleCategoryPress(item)}
        isTablet={isTablet}
      />
    );
  };

  const navigateToScreen = (screenName) => {
    navigation.navigate(screenName);
  };

  // Handle search press - navigate to SearchOptions screen
  const handleSearchPress = () => {
    navigation.navigate('SearchOptionsScreen');
  };

  // Responsive snap points
  const snapPoints = useMemo(() => {
    if (isTablet) {
      return ["32%", "75%"];
    }
    if (height < 700) {
      return ["36%", "80%"];
    } else if (height < 800) {
      return ["38%", "82%"];
    } else if (height < 900) {
      return ["40%", "85%"];
    } else {
      return ["42%", "90%"];
    }
  }, [height, isTablet]);

  const [detailLoading] = useLoader(false);

  // Responsive styles
  const carouselMargin = isTablet ? { marginTop: 5, marginBottom: -12 } : { marginTop: 5, marginBottom: -16 };
  const buttonsMargin = isTablet ? { marginTop: 28, marginBottom: 16, paddingHorizontal: 40 } : { marginTop: 24, marginBottom: 12, paddingHorizontal: 20 };

  return (
    <SafeAreaView backgroundColor={COLORS.primaryThemeColor}>
      <RoundedContainer>
        <Header />
        
        {/* Search Bar */}
        <SearchBar onPress={handleSearchPress} isTablet={isTablet} />
        
        <View style={carouselMargin}>
          <CarouselPagination />
        </View>

        {/* Action Buttons - Responsive */}
        <View style={[{ flexDirection: 'row', justifyContent: 'center', gap: isTablet ? 40 : 20 }, buttonsMargin]}>
          <ListItem
            title="Sales Order"
            image={require('@assets/images/Home/section/service.png')}
            onPress={() => navigateToScreen('SalesOrderChoice')}
            style={isTablet ? { width: 140, height: 140 } : {}}
          />
          <ListItem
            title="POS"
            image={require('@assets/images/Home/section/possss.png')}
            onPress={() => navigateToScreen('POSRegister')}
            style={isTablet ? { width: 140, height: 140 } : {}}
          />
        </View>

        <BottomSheet snapPoints={snapPoints} style={{ marginTop: isTablet ? 8 : 12 }}>
          <ListHeader title="Categories" />
          <BottomSheetFlatList
            key={numColumns}
            data={formatData(data, numColumns)}
            numColumns={numColumns}
            initialNumToRender={isTablet ? 12 : 9}
            renderItem={renderItem}
            keyExtractor={(item, index) => (item._id || item.id || index).toString()}
            contentContainerStyle={{ 
              paddingBottom: '25%', 
              paddingHorizontal: isTablet ? 16 : 8,
            }}
            onEndReached={handleLoadMore}
            showsVerticalScrollIndicator={false}
            onEndReachedThreshold={0.2}
            ListFooterComponent={loading && <ActivityIndicator size="large" color={COLORS.primaryThemeColor} />}
            ListEmptyComponent={
              !loading && (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, isTablet && { fontSize: 16 }]}>No categories available</Text>
                </View>
              )
            }
          />
        </BottomSheet>
        
        <OverlayLoader visible={detailLoading} />

      </RoundedContainer>
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

  // Search Bar Styles
  searchContainer: {
    paddingHorizontal: 16,
    marginTop: -58,
    marginBottom: 8,
  },
  
  searchContainerTablet: {
    paddingHorizontal: 24,
    marginTop: -56,
    marginBottom: 10,
  },
  
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  
  searchBarTablet: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
  },
  
  searchIconText: {
    fontSize: 18,
    marginRight: 10,
  },
  
  searchPlaceholder: {
    fontSize: 14,
    color: '#999',
    flex: 1,
  },
});

export default HomeScreen;