import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { SafeAreaView, RoundedContainer } from '@components/containers';
import { NavigationHeader } from '@components/Header';
import { COLORS, FONT_FAMILY } from '@constants/theme';

const SearchOptionsScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  const handleSearchProducts = () => {
    navigation.navigate('Products', {
      searchMode: true,
      autoFocus: true
    });
  };

  return (
    <SafeAreaView backgroundColor={COLORS.primaryThemeColor}>
      <NavigationHeader
        title="Choose an option"
        onBackPress={() => navigation.goBack()}
      />
      <RoundedContainer>
        <View style={styles.container}>
          <Text style={[styles.headerText, isTablet && { fontSize: 20 }]}>
            What are you looking for?
          </Text>

          <View style={[styles.optionsContainer, isTablet && styles.optionsContainerTablet]}>
            {/* Search Products Option */}
            <TouchableOpacity
              style={[styles.optionCard, isTablet && styles.optionCardTablet]}
              onPress={handleSearchProducts}
            >
              <View style={[styles.iconContainer, isTablet && styles.iconContainerTablet]}>
                <Image
                  source={require('@assets/images/Home/options/search_product.png')}
                  style={[styles.icon, isTablet && styles.iconTablet]}
                  resizeMode="contain"
                />
              </View>
              <Text style={[styles.optionText, isTablet && { fontSize: 18 }]}>
                Search Products
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </RoundedContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 18,
    fontFamily: FONT_FAMILY?.urbanistBold || 'System',
    color: COLORS.primaryThemeColor || '#1316c5',
    marginTop: 20,
    marginBottom: 40,
    textAlign: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    flexWrap: 'wrap',
    marginTop: 20,
  },
  optionsContainerTablet: {
    gap: 30,
    marginTop: 40,
  },
  optionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
    minHeight: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  optionCardTablet: {
    minWidth: 180,
    minHeight: 200,
    padding: 30,
    borderRadius: 20,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconContainerTablet: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 16,
  },
  icon: {
    width: 40,
    height: 40,
    tintColor: COLORS.primaryThemeColor || '#1316c5',
  },
  iconTablet: {
    width: 50,
    height: 50,
  },
  optionText: {
    fontSize: 16,
    fontFamily: FONT_FAMILY?.urbanistBold || 'System',
    color: COLORS.primaryThemeColor || '#1316c5',
    textAlign: 'center',
    fontWeight: '700',
  },
});

export default SearchOptionsScreen;
