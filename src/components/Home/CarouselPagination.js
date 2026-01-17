import { View, StyleSheet, Dimensions, Image } from 'react-native'
import React, { useState } from 'react'
import Carousel, { Pagination } from 'react-native-snap-carousel';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const CarouselPagination = () => {
    const [activeSlide, setActiveSlide] = useState(0);
    const data = [
        { image: require('@assets/images/Home/Banner/sildeshow 1.png') },
        { image: require('@assets/images/Home/Banner/sildeshow 2.png') },
        { image: require('@assets/images/Home/Banner/sildeshow 3.png') },
        { image: require('@assets/images/Home/Banner/sildeshow 4.png') },
        { image: require('@assets/images/Home/Banner/sildeshow 5.png') }
    ];
    const carouselMargin = 8;

    return (
        <View>
            <Carousel
                data={data}
                renderItem={({ item }) => (
                    <View style={styles.item}>
                        <Image source={item.image} style={styles.image} />
                    </View>
                )}
                sliderWidth={screenWidth - 2 * carouselMargin}
                itemWidth={screenWidth - 2 * carouselMargin}
                autoplay={true}
                loop={true}
                loopClonesPerSide={data.length}
                autoplayDelay={500}
                enableMomentum={false}
                lockScrollWhileSnapping={true}
                containerCustomStyle={styles.carouselContainer}
                autoplayInterval={3000}
                onSnapToItem={(index) => setActiveSlide(index)}
            />
            <View style={styles.paginationContainer}>
                <Pagination
                    dotsLength={data.length}
                    activeDotIndex={activeSlide}
                    containerStyle={styles.paginationDotsContainer}
                    dotStyle={styles.paginationDot}
                    inactiveDotOpacity={0.4}
                    inactiveDotScale={0.6}
                />
            </View>
        </View>
    )
}

export default CarouselPagination

const styles = StyleSheet.create({
    image: {
        width: '100%',
        height: screenHeight * 0.25,
        borderRadius: 12,
        borderWidth: 0,
        marginTop: -10, // Move up less aggressively
    },
    carouselContainer: {
        marginHorizontal: 8,
        marginVertical: 0,
        marginTop: -12, // Move up less aggressively
    },
    paginationContainer: {
        position: 'absolute',
        top: screenHeight * 0.16,
        width: '100%',
        alignItems: 'center',
    },
    paginationDotsContainer: {
        backgroundColor: 'transparent',
        paddingHorizontal: 10,
    },
    paginationDot: {
        height: 8,
        borderRadius: 4,
        marginHorizontal: 6,
        backgroundColor: '#5D5FEE',
    },
});
