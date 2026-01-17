import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  View,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
  BackHandler,
  Pressable,
  Text,
} from "react-native";
import {
  CarouselPagination,
  ImageContainer,
  ListHeader,
  Header,
} from "@components/Home";
import { ListItem } from '@components/Options';
import BottomSheet, { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { fetchProductsOdoo } from "@api/services/generalApi";
import { RoundedContainer, SafeAreaView } from "@components/containers";
import { formatData } from "@utils/formatters";
import { COLORS } from "@constants/theme";
import { showToastMessage } from "@components/Toast";
import { ProductsList } from "@components/Product";
import { useDataFetching, useLoader } from "@hooks";
import { useProductStore } from '@stores/product';
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { useAuthStore } from '@stores/auth';
import { fetchProductDetailsByBarcode } from "@api/details/detailApi";
import { OverlayLoader } from "@components/Loader";

const { height } = Dimensions.get("window");

const HomeScreen = ({ navigation }) => {
  const [backPressCount, setBackPressCount] = useState(0);
  const isFocused = useIsFocused();
  const { data, loading, fetchData, fetchMoreData } =
    useDataFetching(fetchProductsOdoo);

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
      try {
        const sanitized = data.map(({ image_url, ...rest }) => rest);
        console.log('Fetched products from Odoo (product.product):', sanitized);
      } catch (e) {
        console.log('Fetched products from Odoo (product.product): [unable to sanitize]');
      }
    }
  }, [data]);

  const handleLoadMore = () => {
    fetchMoreData();
  };

  const { addProduct, setCurrentCustomer } = useProductStore();
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

  const mapToStoreProduct = (p) => ({
    id: `product_${p.id}`,
    remoteId: p.id,
    name: p.name || 'Product',
    product_name: p.name || 'Product',
    price: Number(p.list_price ?? 0),
    price_unit: Number(p.list_price ?? 0),
    quantity: Number(p.qty_available ?? 1),
    qty: Number(p.qty_available ?? 1),
    image_url: p.image_url || null,
    product_id: p.id,
    product_code: p.default_code || null,
    categ_id: Array.isArray(p.categ_id) ? p.categ_id[0] : p.categ_id || null,
  });

  const handleProductPress = (item) => {
    try {
      const details = item;
      console.log('[Home] Opening product details from Home:', { id: item.id, name: item.name });
      navigation.navigate('ProductDetail', { detail: details, fromHome: true });
    } catch (e) {
      console.error('Error adding product from Home to cart', e);
    }
  };

  const renderItem = ({ item }) => {
    if (item.empty) {
      return <View style={[styles.itemStyle, styles.itemInvisible]} />;
    }
    return (
      <ProductsList
        item={item}
        onPress={() => handleProductPress(item)}
        showQuickAdd={false}
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

  const [detailLoading, startLoading, stopLoading] = useLoader(false);

  const handleScan = async (code) => {
    startLoading();
    try {
      const productDetails = await fetchProductDetailsByBarcode(code);
      if (productDetails.length > 0) {
        const details = productDetails[0];
        navigation.navigate('ProductDetail', { detail: details })
      } else {
        showToastMessage("No Products found for this Barcode");
      }
    } catch (error) {
      showToastMessage(`Error fetching inventory details ${error.message}`);
    } finally {
      stopLoading();
    }
  };

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
          <ListHeader title="Products" />
          <BottomSheetFlatList
            data={formatData(data, 3)}
            numColumns={3}
            initialNumToRender={9}
            renderItem={renderItem}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={{ paddingBottom: '25%' }}
            onEndReached={handleLoadMore}
            showsVerticalScrollIndicator={false}
            onEndReachedThreshold={0.2}
            ListFooterComponent={loading && <ActivityIndicator size="large" color="#0000ff" />}
          />
        </BottomSheet>
        
        <OverlayLoader visible={detailLoading} />

      </RoundedContainer>
      
      {/* Bottom Navigation - Three Buttons (OUTSIDE RoundedContainer) */}
      <View pointerEvents="box-none" style={styles.bottomNavigation}>
        {/* Home Button */}
        <Pressable
          onPress={() => navigateToScreen("Home")}
          style={({ pressed }) => [styles.navButton, pressed && styles.navPressed]}
        >
          <Text style={styles.navLabel}>Home</Text>
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
  },
  itemStyle: {
    flex: 1,
    alignItems: "center",
    margin: 6,
    borderRadius: 8,
    marginTop: 5,
    backgroundColor: "white",
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
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    minWidth: 90,
  },

  navPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.95,
  },

  navLabel: {
    fontSize: 13,
    fontWeight: "800",
  },
});

export default HomeScreen;